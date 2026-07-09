/* ============================================================
   csv.js — Export ET import CSV (maintenance via Excel)
   ============================================================ */

/* ---------------- EXPORT ---------------- */
function csvCell(v){
  const s = v == null ? "" : String(v);
  return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
}
function toCsv(rows){
  if(!rows.length) return "";
  const headers = Object.keys(rows[0]);
  // \uFEFF = BOM : force Excel à lire l'UTF-8 (accents corrects)
  return "\uFEFF" + [headers.join(";"), ...rows.map(r=>headers.map(h=>csvCell(r[h])).join(";"))].join("\r\n");
}
function downloadCsv(filename, csv){
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------- IMPORT ---------------- */

/* Parseur CSV robuste : gère les guillemets, ; ou , et le BOM */
function parseCsv(text){
  text = text.replace(/^\uFEFF/, "");                 // retire le BOM
  const firstLine = text.split(/\r?\n/)[0] || "";
  const sep = (firstLine.match(/;/g)||[]).length >= (firstLine.match(/,/g)||[]).length ? ";" : ",";

  const rows = [];
  let row = [], field = "", inQuotes = false;

  for(let i=0; i<text.length; i++){
    const c = text[i], next = text[i+1];
    if(inQuotes){
      if(c === '"' && next === '"'){ field += '"'; i++; }
      else if(c === '"'){ inQuotes = false; }
      else field += c;
    }else{
      if(c === '"') inQuotes = true;
      else if(c === sep){ row.push(field); field = ""; }
      else if(c === "\n"){ row.push(field); rows.push(row); row = []; field = ""; }
      else if(c === "\r"){ /* ignoré */ }
      else field += c;
    }
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }

  const clean = rows.filter(r => r.some(c => String(c).trim() !== ""));
  if(!clean.length) return { headers:[], rows:[] };

  const headers = clean[0].map(h=>h.trim());
  const objects = clean.slice(1).map(r=>{
    const o = {};
    headers.forEach((h,i)=> o[h] = (r[i] ?? "").trim());
    return o;
  });
  return { headers, rows:objects };
}

/* Nombre tolérant : accepte "2,50" comme "2.50" */
function parseNum(v){
  if(v === "" || v == null) return null;
  const n = Number(String(v).replace(",", ".").replace(/\s/g,""));
  return Number.isFinite(n) ? n : null;
}

/* Trouve une colonne quel que soit son intitulé exact */
function pick(row, names){
  for(const n of names){
    for(const key of Object.keys(row)){
      if(key.toLowerCase() === n.toLowerCase()) return row[key];
    }
  }
  return "";
}

/* ------------------------------------------------------------
   Import du stock.
   Le fichier attendu est celui produit par l'export "stock" :
     Produit ; Variante ; Code ; Stock ; Seuil ; Prix vente ; Prix achat
   Identification d'une ligne :
     1) par "Code" (le plus fiable)
     2) sinon par le couple "Produit" + "Variante"
   Colonnes vides = champ non modifié.
   ------------------------------------------------------------ */
async function importStockCsv(text, { dryRun = false } = {}){
  const { rows } = parseCsv(text);
  if(!rows.length) throw new Error("Fichier vide ou illisible.");

  const products = await Products.listAll();

  /* Index de recherche */
  const byCode = new Map(), byName = new Map();
  for(const p of products){
    for(const v of p.variants){
      if(v.code) byCode.set(String(v.code).trim().toLowerCase(), { p, v });
      byName.set((p.name+"||"+v.label).toLowerCase(), { p, v });
    }
  }

  const report = { updated:[], skipped:[], errors:[] };

  for(let i=0; i<rows.length; i++){
    const r = rows[i];
    const lineNo = i + 2; // +1 en-tête, +1 index humain

    const code    = pick(r, ["Code","code","SKU"]).trim();
    const pName   = pick(r, ["Produit","produit","Product","Nom"]).trim();
    const vLabel  = pick(r, ["Variante","variante","Variant","Format"]).trim();

    let match = null;
    if(code) match = byCode.get(code.toLowerCase());
    if(!match && pName && vLabel) match = byName.get((pName+"||"+vLabel).toLowerCase());

    if(!match){
      report.errors.push(`Ligne ${lineNo} : produit introuvable (${code || pName+" / "+vLabel || "ligne vide"})`);
      continue;
    }

    const stock = parseNum(pick(r, ["Stock","stock","Quantité","Quantite","Qty"]));
    const min   = parseNum(pick(r, ["Seuil","seuil","Stock min","Min","Min stock"]));
    const pv    = parseNum(pick(r, ["Prix vente","prix vente","PV","Prix de vente"]));
    const pa    = parseNum(pick(r, ["Prix achat","prix achat","PA","Prix d'achat"]));

    const fields = {};
    if(stock !== null) fields.stock = Math.round(stock);
    if(min   !== null) fields.min_stock = Math.round(min);
    if(pv    !== null) fields.sale_price = pv;
    if(pa    !== null) fields.purchase_price = pa;

    if(!Object.keys(fields).length){
      report.skipped.push(`Ligne ${lineNo} : ${match.p.name} — ${match.v.label} (rien à modifier)`);
      continue;
    }
    if(fields.stock !== undefined && fields.stock < 0){
      report.errors.push(`Ligne ${lineNo} : stock négatif refusé`);
      continue;
    }

    const changes = [];
    if(fields.stock !== undefined && fields.stock !== match.v.stock) changes.push(`stock ${match.v.stock}→${fields.stock}`);
    if(fields.min_stock !== undefined && fields.min_stock !== match.v.min_stock) changes.push(`seuil ${match.v.min_stock}→${fields.min_stock}`);
    if(fields.sale_price !== undefined && Number(fields.sale_price) !== Number(match.v.sale_price)) changes.push(`PV ${match.v.sale_price}→${fields.sale_price}`);
    if(fields.purchase_price !== undefined && Number(fields.purchase_price) !== Number(match.v.purchase_price)) changes.push(`PA ${match.v.purchase_price}→${fields.purchase_price}`);

    if(!changes.length){
      report.skipped.push(`Ligne ${lineNo} : ${match.p.name} — ${match.v.label} (identique)`);
      continue;
    }

    if(dryRun){
      report.updated.push(`${match.p.name} — ${match.v.label} : ${changes.join(", ")}`);
      continue;
    }

    try{
      /* Le stock passe par adjust_stock pour être journalisé */
      if(fields.stock !== undefined && fields.stock !== match.v.stock){
        await Stock.adjust({ variantId:match.v.id, value:fields.stock, mode:"set",
          type:"inventory", reason:"Import CSV" });
        delete fields.stock;
      }
      if(Object.keys(fields).length) await Stock.updateVariant(match.v.id, fields);
      report.updated.push(`${match.p.name} — ${match.v.label} : ${changes.join(", ")}`);
    }catch(e){
      report.errors.push(`Ligne ${lineNo} : ${e.message}`);
    }
  }

  return report;
}
