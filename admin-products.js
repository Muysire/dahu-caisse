/* ============================================================
   admin-products.js — Catalogue, variantes, PHOTOS
   ============================================================ */

let _prodCache = [], _catCache = [];

async function adminProducts(){
  [_prodCache, _catCache] = await Promise.all([Products.listAll(), Products.listCategories()]);

  const list = _prodCache.length ? _prodCache.map(p=>{
    const variants = p.variants.map(v=>{
      const st = stockStatus(v.stock, v.min_stock);
      const thumb = v.photo_url
        ? `<div style="width:34px;height:34px;border-radius:8px;background-image:url('${v.photo_url}');background-size:cover;background-position:center;flex-shrink:0"></div>`
        : `<div style="width:34px;height:34px;border-radius:8px;background:var(--card);display:grid;place-items:center;font-size:16px;opacity:.5;flex-shrink:0">${p.category?.icon||"✨"}</div>`;
      return `<div class="row between gap-2" style="background:var(--bg);border-radius:10px;padding:8px 12px">
        <div class="row gap-2" style="min-width:0">
          ${thumb}
          <div style="min-width:0">
            <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(v.label)}</div>
            <div class="fm muted" style="font-size:12px">${euro(v.sale_price)} · achat ${euro(v.purchase_price)}</div>
          </div>
        </div>
        <span class="badge ${st}">${v.stock}</span>
      </div>`;
    }).join("");

    return `<div class="card pad" style="margin-bottom:12px">
      <div class="row between wrap gap-3">
        <div style="min-width:0;flex:1">
          <div class="row gap-2">
            <span style="font-size:18px">${p.category?.icon||"✨"}</span>
            <span class="fd" style="font-size:24px">${esc(p.name)}</span>
            ${!p.active  ? '<span class="badge out">Inactif</span>' : ""}
            ${!p.visible ? '<span class="badge violet">Masqué menu</span>' : ""}
          </div>
          <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-top:12px">${variants}</div>
        </div>
        <div class="row gap-2">
          <button class="btn secondary sm" data-edit="${p.id}">${icon("edit",15)} Éditer</button>
          <button class="btn ghost sm" data-toggle="${p.id}">${p.active?"Désactiver":"Activer"}</button>
          <button class="btn ghost sm" data-del-prod="${p.id}" style="color:var(--out)">${icon("trash",15)}</button>
        </div>
      </div>
    </div>`;
  }).join("") : `<div class="card pad center"><p class="muted">Aucun produit. Crée le premier.</p></div>`;

  setAdminContent(
    pageHead("Produits","Catalogue & variantes", `<button class="btn" data-new-product>${icon("plus",18)} Nouveau produit</button>`) + list
  );

  document.querySelector("[data-new-product]").onclick = ()=>openProductForm(null);
  document.querySelectorAll("[data-edit]").forEach(b=>
    b.onclick = ()=>openProductForm(_prodCache.find(p=>p.id===b.dataset.edit)));
  document.querySelectorAll("[data-toggle]").forEach(b=>b.onclick = async ()=>{
    const p = _prodCache.find(x=>x.id===b.dataset.toggle);
    await Products.toggleActive(p.id, !p.active);
    toast(p.active ? "Produit désactivé" : "Produit réactivé");
    adminProducts();
  });
  document.querySelectorAll("[data-del-prod]").forEach(b=>b.onclick = async ()=>{
    const p = _prodCache.find(x=>x.id===b.dataset.delProd);
    const ok = await confirmDialog({
      title:"Supprimer le produit",
      message:`Supprimer définitivement « ${p.name} » et toutes ses variantes ? Cette action est irréversible.`,
      confirmLabel:"Supprimer", danger:true
    });
    if(!ok) return;
    try{ await Products.remove(p.id); toast("Produit supprimé"); adminProducts(); }
    catch(e){ toast(e.message,"error"); }
  });
}

/* ------------------------------------------------------------
   Formulaire produit (avec photo par variante)
   ------------------------------------------------------------ */
function openProductForm(product){
  const isEdit = !!product;
  let variants = isEdit
    ? product.variants.map(v=>({ ...v }))
    : [{ label:"Standard", code:"", purchase_price:0, sale_price:0, stock:0, min_stock:0, unit:"unité", volume_cl:null, photo_url:null }];

  const box = document.createElement("div");

  function variantRow(v,i){
    const catIcon = _catCache.find(c=>c.id === (product?.category_id || _catCache[0]?.id))?.icon || "✨";
    const preview = v.photo_url
      ? `<img src="${v.photo_url}" alt="">`
      : `<span style="opacity:.4">${catIcon}</span>`;
    return `<div class="variant-box" data-vi="${i}">
      <div class="row between" style="margin-bottom:12px">
        <span class="muted" style="font-size:12px;font-weight:700;text-transform:uppercase">Variante ${i+1}</span>
        ${variants.length>1 ? `<button class="btn ghost sm" data-del-variant="${i}" style="padding:2px 6px">${icon("trash",16)}</button>` : ""}
      </div>

      <div class="row gap-4 wrap" style="align-items:flex-start;margin-bottom:14px">
        <div>
          <span style="display:block;margin-bottom:6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Photo</span>
          <div class="photo-preview" data-preview="${i}">${preview}</div>
          <div class="photo-actions">
            <button type="button" class="btn secondary sm" data-pick-photo="${i}">${icon("image",14)} Choisir</button>
            ${v.photo_url ? `<button type="button" class="btn ghost sm" data-clear-photo="${i}" style="color:var(--out)">${icon("trash",14)}</button>` : ""}
          </div>
          <input type="file" accept="image/*" class="file-input" data-file="${i}">
          <p class="muted" style="font-size:11px;margin-top:6px;max-width:150px">Sans photo, l'emoji de la catégorie s'affiche.</p>
        </div>

        <div style="flex:1;min-width:260px">
          <div class="form-grid">
            <label class="field"><span>Libellé</span><input class="input" data-f="label" value="${esc(v.label)}" placeholder="33 cl"></label>
            <label class="field"><span>Code</span><input class="input" data-f="code" value="${esc(v.code||"")}" placeholder="COCA-33"></label>
            <label class="field"><span>Prix d'achat (€)</span><input class="input" type="number" step="0.01" data-f="purchase_price" value="${v.purchase_price}"></label>
            <label class="field"><span>Prix de vente (€)</span><input class="input" type="number" step="0.01" data-f="sale_price" value="${v.sale_price}"></label>
            <label class="field"><span>Stock</span><input class="input" type="number" data-f="stock" value="${v.stock}"></label>
            <label class="field"><span>Stock min (seuil)</span><input class="input" type="number" data-f="min_stock" value="${v.min_stock}"></label>
            <label class="field"><span>Unité</span><input class="input" data-f="unit" value="${esc(v.unit||"unité")}" placeholder="canette"></label>
            <label class="field"><span>Volume (cl)</span><input class="input" type="number" step="0.1" data-f="volume_cl" value="${v.volume_cl ?? ""}" placeholder="33"></label>
          </div>
        </div>
      </div>
    </div>`;
  }

  function paint(){
    box.innerHTML = `
      <div class="form-grid">
        <label class="field"><span>Nom du produit</span><input class="input" id="pf-name" value="${esc(product?.name||"")}" placeholder="Coca-Cola"></label>
        <label class="field"><span>Catégorie</span><select class="select" id="pf-cat">
          ${_catCache.map(c=>`<option value="${c.id}" ${product?.category_id===c.id?"selected":""}>${c.icon} ${esc(c.name)}</option>`).join("")}
        </select></label>
        <label class="field full"><span>Description (optionnelle)</span><input class="input" id="pf-desc" value="${esc(product?.description||"")}"></label>
        <label class="field"><span>Ordre d'affichage</span><input class="input" type="number" id="pf-order" value="${product?.display_order ?? 0}"></label>
        <div class="field row gap-3" style="align-items:center;padding-top:18px">
          <label class="row gap-2" style="cursor:pointer"><input type="checkbox" id="pf-active" ${product?.active!==false?"checked":""} style="width:18px;height:18px;accent-color:var(--violet)"> <span style="font-size:14px">Actif</span></label>
          <label class="row gap-2" style="cursor:pointer"><input type="checkbox" id="pf-visible" ${product?.visible!==false?"checked":""} style="width:18px;height:18px;accent-color:var(--violet)"> <span style="font-size:14px">Visible menu</span></label>
        </div>
      </div>

      <div class="row between" style="margin:6px 0 10px">
        <h3 class="violet-text" style="font-size:20px">Variantes</h3>
        <button class="btn secondary sm" id="add-variant">${icon("plus",16)} Ajouter</button>
      </div>
      <div id="vlist">${variants.map(variantRow).join("")}</div>

      <div class="modal-foot" data-modal-actions>
        <button class="btn secondary" data-close-modal>Fermer</button>
        <button class="btn" id="pf-save">Enregistrer</button>
      </div>`;

    box.querySelector("#add-variant").onclick = ()=>{
      readVariants();
      variants.push({ label:"", code:"", purchase_price:0, sale_price:0, stock:0, min_stock:0, unit:"unité", volume_cl:null, photo_url:null });
      paint();
    };
    box.querySelectorAll("[data-del-variant]").forEach(b=>b.onclick = ()=>{
      readVariants(); variants.splice(+b.dataset.delVariant, 1); paint();
    });

    /* --- Photo : ouverture du sélecteur --- */
    box.querySelectorAll("[data-pick-photo]").forEach(b=>b.onclick = ()=>{
      box.querySelector(`[data-file="${b.dataset.pickPhoto}"]`).click();
    });
    /* --- Photo : lecture + aperçu --- */
    box.querySelectorAll("[data-file]").forEach(input=>input.onchange = async e=>{
      const i = +input.dataset.file;
      const file = e.target.files[0];
      if(!file) return;
      try{
        readVariants();
        variants[i].photo_url = await readImageAsDataUrl(file, 400);
        paint();
        toast("Photo ajoutée");
      }catch(err){ toast(err.message,"error"); }
    });
    /* --- Photo : suppression --- */
    box.querySelectorAll("[data-clear-photo]").forEach(b=>b.onclick = ()=>{
      readVariants();
      variants[+b.dataset.clearPhoto].photo_url = null;
      paint();
    });

    box.querySelector("#pf-save").onclick = save;
    bindCloseButtons(box);
  }

  /* Lit les champs saisis dans l'objet variants (sans perdre les photos) */
  function readVariants(){
    box.querySelectorAll("[data-vi]").forEach(row=>{
      const i = +row.dataset.vi;
      const v = variants[i];
      row.querySelectorAll("[data-f]").forEach(input=>{
        const f = input.dataset.f;
        if(["purchase_price","sale_price","stock","min_stock"].includes(f)) v[f] = Number(input.value) || 0;
        else if(f === "volume_cl") v[f] = input.value ? Number(input.value) : null;
        else v[f] = input.value || (f === "label" ? "Standard" : null);
      });
    });
  }

  async function save(){
    readVariants();
    const name = box.querySelector("#pf-name").value.trim();
    if(!name) return toast("Le nom est obligatoire","error");

    const prod = {
      id: product?.id,
      name,
      category_id: box.querySelector("#pf-cat").value,
      description: box.querySelector("#pf-desc").value || null,
      display_order: Number(box.querySelector("#pf-order").value) || 0,
      active:  box.querySelector("#pf-active").checked,
      visible: box.querySelector("#pf-visible").checked
    };
    try{
      await Products.save(prod, variants);
      toast(isEdit ? "Produit mis à jour" : "Produit créé");
      closeModal();
      adminProducts();
    }catch(e){ toast(e.message,"error"); }
  }

  paint();
  const ov = openModal({ title: isEdit ? "Modifier le produit" : "Nouveau produit", body:box, wide:true, showFooterClose:false });
  bindCloseButtons(ov);
}
