/* ============================================================
   admin-stock.js — Stock, prévisions, achats, fournisseurs
   ============================================================ */

/* ---------------- STOCK ---------------- */
let _stockRows = [];

async function adminStock(){
  const products = await Products.listAll();
  _stockRows = [];
  for(const p of products){
    for(const v of p.variants){
      _stockRows.push({ variantId:v.id, name:p.name, label:v.label, stock:v.stock, min:v.min_stock });
    }
  }
  /* Les plus critiques en haut */
  _stockRows.sort((a,b)=>(a.stock-a.min)-(b.stock-b.min));

  const body = _stockRows.map(r=>{
    const st = stockStatus(r.stock, r.min);
    return `<tr>
      <td style="font-weight:600">${esc(r.name)}</td>
      <td class="muted">${esc(r.label)}</td>
      <td class="center fm" style="font-size:18px;font-weight:700">${r.stock}</td>
      <td class="center fm muted">${r.min}</td>
      <td class="center"><span class="badge ${st}">${st==="out"?"Rupture":st==="low"?"Bas":"OK"}</span></td>
      <td style="text-align:right">
        <button class="btn secondary sm" data-restock="${r.variantId}">${icon("plus",14)} Réappro</button>
        <button class="btn ghost sm" data-correct="${r.variantId}">${icon("edit",14)}</button>
      </td>
    </tr>`;
  }).join("");

  setAdminContent(pageHead("Stock","État des stocks en temps réel",
    `<a href="#admin/exports" class="btn secondary">${icon("upload",16)} Import CSV</a>`) + `
    <div class="card" style="overflow-x:auto"><table>
      <thead><tr><th>Produit</th><th>Variante</th><th class="center">Stock</th><th class="center">Seuil</th><th class="center">État</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>`);

  document.querySelectorAll("[data-restock]").forEach(b=>b.onclick = ()=>openAdjust(b.dataset.restock,"add"));
  document.querySelectorAll("[data-correct]").forEach(b=>b.onclick = ()=>openAdjust(b.dataset.correct,"set"));
}

function openAdjust(variantId, mode){
  const r = _stockRows.find(x=>x.variantId===variantId);
  const box = document.createElement("div");
  box.innerHTML = `
    <p class="muted" style="font-size:14px">${esc(r.name)} — ${esc(r.label)}<br>
      Stock actuel : <span class="fm" style="color:var(--text);font-weight:700">${r.stock}</span></p>
    <label class="field" style="margin-top:14px"><span>${mode==="add"?"Quantité à ajouter":"Nouveau stock total"}</span>
      <input class="input" type="number" id="adj-val" value="${mode==="set"?r.stock:0}"></label>
    <p id="adj-prev" class="fm violet-text ${mode==="add"?"":"hidden"}" style="font-size:13px;margin-top:-6px"></p>
    <label class="field"><span>Motif (optionnel)</span>
      <input class="input" id="adj-reason" placeholder="${mode==="add"?"Livraison…":"Casse, erreur…"}"></label>
    <div class="modal-foot" data-modal-actions>
      <button class="btn secondary" data-close-modal>Fermer</button>
      <button class="btn" id="adj-save">Valider</button>
    </div>`;

  const val = box.querySelector("#adj-val"), prev = box.querySelector("#adj-prev");
  const update = ()=>{ if(mode==="add") prev.textContent = `Nouveau stock : ${r.stock + (Number(val.value)||0)}`; };
  val.oninput = update; update();

  box.querySelector("#adj-save").onclick = async ()=>{
    try{
      await Stock.adjust({ variantId, value:Number(val.value)||0, mode,
        type: mode==="add" ? "restock" : "correction",
        reason: box.querySelector("#adj-reason").value });
      toast("Stock mis à jour");
      closeModal(); adminStock();
    }catch(e){ toast(e.message,"error"); }
  };

  const ov = openModal({ title: mode==="add" ? "Réapprovisionner" : "Corriger le stock", body:box, showFooterClose:false });
  bindCloseButtons(ov);
}

/* ---------------- PRÉVISIONS ---------------- */
let _fcProducts = [];
const CAT_DRINK = { bieres:"beer", softs:"soft", alcools:"alcohol" };

async function adminForecasts(){
  _fcProducts = await Products.listAll();
  setAdminContent(pageHead("Prévisions","Anticipe les besoins en stock") + `
    <div class="grid" style="grid-template-columns:320px 1fr;gap:24px;align-items:start">
      <div class="card pad">
        <h2 class="violet-text" style="font-size:24px;margin-bottom:16px">Paramètres</h2>
        <label class="field"><span>Nombre de personnes</span><input class="input" type="number" id="f-people" value="200"></label>
        <label class="field"><span>Nombre de jours</span><input class="input" type="number" id="f-days" value="1"></label>
        <div class="divider"></div>
        <p class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Conso / personne / jour</p>
        <label class="field"><span>Bière (litres)</span><input class="input" type="number" step="0.1" id="f-beer" value="1.5"></label>
        <label class="field"><span>Soft (litres)</span><input class="input" type="number" step="0.1" id="f-soft" value="0.5"></label>
        <label class="field"><span>Alcool fort (litres)</span><input class="input" type="number" step="0.1" id="f-alc" value="0.2"></label>
      </div>
      <div class="card" style="overflow-x:auto" id="fc-result"></div>
    </div>`);

  ["f-people","f-days","f-beer","f-soft","f-alc"].forEach(id=>document.getElementById(id).oninput = fcCompute);
  fcCompute();
}

function fcCompute(){
  const people = +document.getElementById("f-people").value || 0;
  const days   = +document.getElementById("f-days").value   || 0;
  const liters = {
    beer:    (+document.getElementById("f-beer").value||0) * people * days,
    soft:    (+document.getElementById("f-soft").value||0) * people * days,
    alcohol: (+document.getElementById("f-alc").value ||0) * people * days
  };

  const rows = [];
  for(const type of ["beer","soft","alcohol"]){
    const list = [];
    for(const p of _fcProducts){
      const drink = p.category ? CAT_DRINK[p.category.slug] : null;
      if(drink === type) p.variants.forEach(v=>list.push({ p, v }));
    }
    if(!list.length) continue;
    const perVariant = liters[type] / list.length;
    for(const { p, v } of list){
      const volL = v.volume_cl ? v.volume_cl/100 : null;
      rows.push({ name:p.name, label:v.label, reco: volL ? Math.ceil(perVariant/volL) : 0, current:v.stock });
    }
  }

  const res = document.getElementById("fc-result");
  res.innerHTML = rows.length
    ? `<table><thead><tr><th>Produit</th><th>Variante</th><th class="center">Recommandé</th><th class="center">En stock</th><th class="center">Manque</th></tr></thead><tbody>
        ${rows.map(r=>{
          const miss = Math.max(0, r.reco - r.current);
          return `<tr>
            <td style="font-weight:600">${esc(r.name)}</td>
            <td class="muted">${esc(r.label)}</td>
            <td class="center fm violet-text" style="font-weight:700">${r.reco}</td>
            <td class="center fm">${r.current}</td>
            <td class="center">${miss>0?`<span class="badge out">+${miss}</span>`:`<span class="badge ok">OK</span>`}</td>
          </tr>`;
        }).join("")}
      </tbody></table>`
    : `<p class="muted" style="padding:20px">Renseigne le volume (cl) des variantes de boissons pour activer le calcul.</p>`;
}

/* ---------------- ACHATS ---------------- */
async function adminPurchases(){
  const products  = await Products.listAll();
  const suppliers = await Suppliers.list();
  const variants  = [];
  for(const p of products) for(const v of p.variants) variants.push({ id:v.id, label:`${p.name} — ${v.label}` });

  const recent = await Stock.purchases(10);
  const recentHTML = recent.length
    ? recent.map(p=>`<li class="row between" style="background:var(--bg);border-radius:10px;padding:9px 12px;margin-bottom:8px;list-style:none">
        <div><div style="font-size:14px">${esc(p.supplier?.name||"Sans fournisseur")}</div>
        <div class="fm muted" style="font-size:12px">${fdate(p.purchase_date)} · ×${p.qty}</div></div>
        <span class="fm violet-text" style="font-weight:700">${euro(p.total_cost)}</span>
      </li>`).join("")
    : `<p class="center muted" style="padding:20px">Aucun achat</p>`;

  setAdminContent(pageHead("Achats","Saisie des achats fournisseurs") + `
    <div class="two-col">
      <div class="card pad">
        <h2 class="violet-text" style="font-size:24px;margin-bottom:16px">Nouvel achat</h2>
        <label class="field"><span>Fournisseur</span><select class="select" id="pu-supplier">
          <option value="">— Aucun —</option>${suppliers.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}
        </select></label>
        <label class="field"><span>Produit / variante</span><select class="select" id="pu-variant">
          ${variants.map(o=>`<option value="${o.id}">${esc(o.label)}</option>`).join("")}
        </select></label>
        <div class="form-grid">
          <label class="field"><span>Quantité</span><input class="input" type="number" id="pu-qty" value="1"></label>
          <label class="field"><span>Prix unitaire (€)</span><input class="input" type="number" step="0.01" id="pu-price" value="0"></label>
          <label class="field"><span>Référence</span><input class="input" id="pu-ref"></label>
          <label class="field"><span>Date</span><input class="input" type="date" id="pu-date" value="${new Date().toISOString().slice(0,10)}"></label>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:12px;text-align:center;margin-bottom:14px">
          <span class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:1px">Coût total</span>
          <div class="fm violet-text" style="font-size:26px;font-weight:700" id="pu-total">${euro(0)}</div>
        </div>
        <button class="btn lg block" id="pu-save">Enregistrer l'achat</button>
      </div>
      <div class="card pad">
        <h2 class="violet-text" style="font-size:24px;margin-bottom:16px">Achats récents</h2>
        <ul style="padding:0;margin:0">${recentHTML}</ul>
      </div>
    </div>`);

  const qty = document.getElementById("pu-qty"), price = document.getElementById("pu-price"), total = document.getElementById("pu-total");
  const upd = ()=> total.textContent = euro((+qty.value||0) * (+price.value||0));
  qty.oninput = upd; price.oninput = upd;

  document.getElementById("pu-save").onclick = async ()=>{
    const variantId = document.getElementById("pu-variant").value;
    if(!variantId || (+qty.value||0) <= 0) return toast("Sélectionne un produit et une quantité valide","error");
    try{
      await Stock.recordPurchase({
        supplierId: document.getElementById("pu-supplier").value || null,
        variantId, qty:+qty.value, unitPrice:+price.value||0,
        supplierRef: document.getElementById("pu-ref").value,
        date: document.getElementById("pu-date").value
      });
      toast("Achat enregistré · stock réapprovisionné");
      adminPurchases();
    }catch(e){ toast(e.message,"error"); }
  };
}

/* ---------------- FOURNISSEURS ---------------- */
let _supCache = [];

async function adminSuppliers(){
  _supCache = await Suppliers.list();
  const cards = _supCache.length ? _supCache.map(s=>`
    <div class="card pad">
      <div class="row between">
        <h3 class="fd" style="font-size:20px">${esc(s.name)}</h3>
        <div class="row gap-2">
          <button class="btn ghost sm" data-edit-sup="${s.id}" style="padding:4px">${icon("edit",15)}</button>
          <button class="btn ghost sm" data-del-sup="${s.id}" style="padding:4px;color:var(--out)">${icon("trash",15)}</button>
        </div>
      </div>
      ${s.contact ? `<p class="muted" style="font-size:14px;margin-top:4px">${esc(s.contact)}</p>` : ""}
      <div style="margin-top:8px;font-size:14px" class="muted">
        ${s.phone ? `<div>📞 ${esc(s.phone)}</div>` : ""}
        ${s.email ? `<div>✉️ ${esc(s.email)}</div>` : ""}
      </div>
      ${s.notes ? `<p style="margin-top:8px;background:var(--bg);border-radius:8px;padding:8px;font-size:12px" class="muted">${esc(s.notes)}</p>` : ""}
    </div>`).join("") : `<div class="card pad center"><p class="muted">Aucun fournisseur.</p></div>`;

  setAdminContent(pageHead("Fournisseurs","Carnet d'adresses",
    `<button class="btn" data-new-sup>${icon("plus",18)} Nouveau</button>`) +
    `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${cards}</div>`);

  document.querySelector("[data-new-sup]").onclick = ()=>openSupplierForm(null);
  document.querySelectorAll("[data-edit-sup]").forEach(b=>
    b.onclick = ()=>openSupplierForm(_supCache.find(s=>s.id===b.dataset.editSup)));
  document.querySelectorAll("[data-del-sup]").forEach(b=>b.onclick = async ()=>{
    const s = _supCache.find(x=>x.id===b.dataset.delSup);
    const ok = await confirmDialog({ title:"Supprimer le fournisseur",
      message:`Supprimer « ${s.name} » ?`, confirmLabel:"Supprimer", danger:true });
    if(!ok) return;
    try{ await Suppliers.remove(s.id); toast("Fournisseur supprimé"); adminSuppliers(); }
    catch(e){ toast(e.message,"error"); }
  });
}

function openSupplierForm(s){
  const box = document.createElement("div");
  box.innerHTML = `
    <label class="field"><span>Nom</span><input class="input" id="s-name" value="${esc(s?.name||"")}"></label>
    <label class="field"><span>Contact</span><input class="input" id="s-contact" value="${esc(s?.contact||"")}"></label>
    <div class="form-grid">
      <label class="field"><span>Téléphone</span><input class="input" id="s-phone" value="${esc(s?.phone||"")}"></label>
      <label class="field"><span>Email</span><input class="input" type="email" id="s-email" value="${esc(s?.email||"")}"></label>
    </div>
    <label class="field"><span>Notes</span><input class="input" id="s-notes" value="${esc(s?.notes||"")}"></label>
    <div class="modal-foot" data-modal-actions>
      <button class="btn secondary" data-close-modal>Fermer</button>
      <button class="btn" id="s-save">Enregistrer</button>
    </div>`;

  box.querySelector("#s-save").onclick = async ()=>{
    const name = box.querySelector("#s-name").value.trim();
    if(!name) return toast("Le nom est obligatoire","error");
    try{
      await Suppliers.save({ id:s?.id, name,
        contact: box.querySelector("#s-contact").value || null,
        phone:   box.querySelector("#s-phone").value   || null,
        email:   box.querySelector("#s-email").value   || null,
        notes:   box.querySelector("#s-notes").value   || null });
      toast(s ? "Fournisseur mis à jour" : "Fournisseur créé");
      closeModal(); adminSuppliers();
    }catch(e){ toast(e.message,"error"); }
  };

  const ov = openModal({ title: s ? "Modifier le fournisseur" : "Nouveau fournisseur", body:box, showFooterClose:false });
  bindCloseButtons(ov);
}
