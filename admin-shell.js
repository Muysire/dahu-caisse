/* ============================================================
   admin-exports.js — Exports CSV + IMPORT du stock (Excel)
   ============================================================ */

async function adminExports(){
  const exportItems = [
    { type:"stock",       label:"État du stock",       desc:"Stock, seuils et prix. C'est CE fichier qu'on réimporte.", icon:"boxes"   },
    { type:"ventes",      label:"Ventes",              desc:"Toutes les lignes de vente.",            icon:"cart"    },
    { type:"achats",      label:"Achats",              desc:"Historique des achats fournisseurs.",    icon:"bag"     },
    { type:"mouvements",  label:"Mouvements de stock", desc:"Journal complet.",                       icon:"history" }
  ];

  setAdminContent(pageHead("Import / Export","Maintenance rapide via Excel") + `

    <!-- ---------- IMPORT ---------- -->
    <div class="card pad" style="margin-bottom:28px">
      <div class="row gap-3" style="margin-bottom:6px">
        <span style="color:var(--violet-light)">${icon("upload",24)}</span>
        <h2 class="violet-text" style="font-size:26px">Importer le stock</h2>
      </div>
      <p class="muted" style="font-size:14px;margin-bottom:18px">
        Exporte « État du stock », modifie-le dans Excel, réimporte-le ici.
        Les lignes sont retrouvées par <strong>Code</strong>, ou à défaut par <strong>Produit + Variante</strong>.
        Une colonne vide = valeur inchangée.
      </p>

      <div class="dropzone" id="dropzone">
        ${icon("upload",30)}
        <p style="margin-top:10px;font-weight:600">Glisse ton fichier CSV ici</p>
        <p class="muted" style="font-size:13px">ou clique pour le choisir</p>
        <input type="file" accept=".csv,text/csv" class="file-input" id="csv-file">
      </div>

      <div id="import-zone" class="hidden">
        <div class="row between wrap gap-3" style="margin-top:16px">
          <span class="fm violet-text" id="csv-name"></span>
          <div class="row gap-2">
            <button class="btn ghost sm" id="csv-cancel">Annuler</button>
            <button class="btn secondary sm" id="csv-preview">Prévisualiser</button>
            <button class="btn sm" id="csv-apply">Appliquer</button>
          </div>
        </div>
        <div id="import-report" class="import-report hidden"></div>
      </div>

      <p class="muted" style="font-size:12px;margin-top:16px">
        Colonnes reconnues : <span class="fm">Produit · Variante · Code · Stock · Seuil · Prix vente · Prix achat</span><br>
        Les changements de stock sont journalisés (type « Inventaire », motif « Import CSV »).
      </p>
    </div>

    <!-- ---------- EXPORT ---------- -->
    <h2 class="violet-text" style="font-size:26px;margin-bottom:16px">Exporter</h2>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      ${exportItems.map(e=>`<div class="card pad">
        <div class="row gap-4" style="align-items:flex-start">
          <div style="background:rgba(124,58,237,.15);border-radius:10px;padding:12px;color:var(--violet-light)">${icon(e.icon,24)}</div>
          <div style="flex:1">
            <h3 class="fd" style="font-size:20px">${e.label}</h3>
            <p class="muted" style="font-size:14px;margin-top:4px">${e.desc}</p>
            <button class="btn secondary sm" data-export="${e.type}" style="margin-top:12px">${icon("download",16)} Télécharger</button>
          </div>
        </div>
      </div>`).join("")}
    </div>
    <p class="muted" style="font-size:12px;margin-top:24px">Fichiers UTF-8, séparateur « ; » — compatibles Excel / LibreOffice.</p>`);

  bindExportButtons();
  bindImportZone();
}

/* ---------------- EXPORT ---------------- */
function bindExportButtons(){
  document.querySelectorAll("[data-export]").forEach(b=>b.onclick = async ()=>{
    const type = b.dataset.export;
    try{
      let rows = [], filename = "export.csv";

      if(type === "stock"){
        const products = await Products.listAll();
        for(const p of products) for(const v of p.variants){
          rows.push({
            Produit:p.name, Variante:v.label, Code:v.code||"",
            Stock:v.stock, Seuil:v.min_stock,
            "Prix vente":v.sale_price, "Prix achat":v.purchase_price
          });
        }
        filename = "stock.csv";
      }
      else if(type === "ventes"){
        const items = await Sales.allItems();
        rows = items.map(it=>({
          Date:fdatetime(it.created_at), Ticket:it.sale_id, Produit:it.product_name,
          "Quantité":it.qty, "Prix unitaire":it.unit_price, Total:it.line_total
        }));
        filename = "ventes.csv";
      }
      else if(type === "achats"){
        const purchases = await Stock.purchases(9999);
        rows = purchases.map(p=>({
          Date:p.purchase_date, Fournisseur:p.supplier?.name||"", "Quantité":p.qty,
          "Prix unitaire":p.unit_purchase_price, "Coût total":p.total_cost, "Référence":p.supplier_ref||""
        }));
        filename = "achats.csv";
      }
      else{
        const moves = await Stock.movements();
        rows = moves.map(m=>({
          Date:fdatetime(m.created_at), Produit:m.variant?.product?.name||"", Variante:m.variant?.label||"",
          Type:m.type, Variation:m.qty_delta, "Stock après":m.stock_after, Motif:m.reason||""
        }));
        filename = "mouvements.csv";
      }

      if(!rows.length) return toast("Aucune donnée à exporter","error");
      downloadCsv(filename, toCsv(rows));
      toast("Export téléchargé : " + filename);
    }catch(e){ toast(e.message,"error"); }
  });
}

/* ---------------- IMPORT ---------------- */
function bindImportZone(){
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("csv-file");
  const zone = document.getElementById("import-zone");
  const nameEl = document.getElementById("csv-name");
  const reportEl = document.getElementById("import-report");

  let csvText = null;

  const showReport = (report, isPreview)=>{
    reportEl.classList.remove("hidden");
    const head = isPreview
      ? `<p style="margin-bottom:10px"><strong>Prévisualisation</strong> — rien n'a encore été modifié.</p>`
      : `<p style="margin-bottom:10px"><strong>Import terminé.</strong></p>`;
    reportEl.innerHTML = head + `
      <p class="ok">✓ ${report.updated.length} ligne(s) ${isPreview?"à mettre à jour":"mise(s) à jour"}</p>
      ${report.updated.map(l=>`<div class="ok">&nbsp;&nbsp;• ${esc(l)}</div>`).join("")}
      ${report.skipped.length ? `<p class="muted" style="margin-top:8px">— ${report.skipped.length} ligne(s) ignorée(s) (aucun changement)</p>` : ""}
      ${report.errors.length ? `<p class="err" style="margin-top:8px">⚠ ${report.errors.length} erreur(s)</p>` +
        report.errors.map(l=>`<div class="err">&nbsp;&nbsp;• ${esc(l)}</div>`).join("") : ""}`;
  };

  const loadFile = file=>{
    if(!file) return;
    if(!/\.csv$/i.test(file.name) && file.type !== "text/csv"){
      return toast("Choisis un fichier .csv","error");
    }
    const reader = new FileReader();
    reader.onload = ()=>{
      csvText = reader.result;
      nameEl.textContent = `📄 ${file.name}`;
      zone.classList.remove("hidden");
      reportEl.classList.add("hidden");
      toast("Fichier chargé — prévisualise avant d'appliquer");
    };
    reader.onerror = ()=>toast("Lecture impossible","error");
    reader.readAsText(file, "UTF-8");
  };

  dropzone.onclick = ()=>fileInput.click();
  fileInput.onchange = e=>loadFile(e.target.files[0]);

  ["dragenter","dragover"].forEach(ev=>dropzone.addEventListener(ev, e=>{
    e.preventDefault(); dropzone.classList.add("drag");
  }));
  ["dragleave","drop"].forEach(ev=>dropzone.addEventListener(ev, e=>{
    e.preventDefault(); dropzone.classList.remove("drag");
  }));
  dropzone.addEventListener("drop", e=>loadFile(e.dataTransfer.files[0]));

  document.getElementById("csv-cancel").onclick = ()=>{
    csvText = null; fileInput.value = "";
    zone.classList.add("hidden"); reportEl.classList.add("hidden");
  };

  document.getElementById("csv-preview").onclick = async ()=>{
    if(!csvText) return;
    try{ showReport(await importStockCsv(csvText, { dryRun:true }), true); }
    catch(e){ toast(e.message,"error"); }
  };

  document.getElementById("csv-apply").onclick = async ()=>{
    if(!csvText) return;
    let preview;
    try{ preview = await importStockCsv(csvText, { dryRun:true }); }
    catch(e){ return toast(e.message,"error"); }

    if(!preview.updated.length) return toast("Aucun changement à appliquer","error");

    const ok = await confirmDialog({
      title:"Appliquer l'import",
      message:`${preview.updated.length} ligne(s) vont être modifiées${preview.errors.length?` (et ${preview.errors.length} erreur(s) ignorée(s))`:""}. Continuer ?`,
      confirmLabel:"Appliquer"
    });
    if(!ok) return;

    try{
      const report = await importStockCsv(csvText, { dryRun:false });
      showReport(report, false);
      toast(`${report.updated.length} ligne(s) mise(s) à jour`);
    }catch(e){ toast(e.message,"error"); }
  };
}
