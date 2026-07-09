/* ============================================================
   page-caisse.js — Caisse tactile (POS)
   Aucun paiement ici : le barman valide, l'encaissement se fait
   sur le TPE. La validation décrémente le stock.
   ============================================================ */

let CAISSE = { products:[], activeCat:"all", cart:[], submitting:false, drawerOpen:false };

async function renderCaisse(){
  CAISSE.products = await Products.listActive();
  paintCaisse();
}

/* ---------- Sélecteurs ---------- */
function caisseCats(){
  const m = new Map();
  for(const p of CAISSE.products){
    if(p.category) m.set(p.category.slug, { slug:p.category.slug, name:p.category.name, icon:p.category.icon||"✨" });
  }
  return [...m.values()];
}
function caisseFiltered(){
  return CAISSE.activeCat === "all"
    ? CAISSE.products
    : CAISSE.products.filter(p => p.category?.slug === CAISSE.activeCat);
}
const cartTotal = () => CAISSE.cart.reduce((s,l)=>s+l.salePrice*l.qty, 0);
const cartCount = () => CAISSE.cart.reduce((s,l)=>s+l.qty, 0);

/* ---------- Actions panier ---------- */
function addVariant(v, productName){
  const line = CAISSE.cart.find(x=>x.variantId === v.id);
  if(line){ if(line.qty < v.stock) line.qty++; }
  else{
    if(v.stock <= 0) return;
    CAISSE.cart.push({ variantId:v.id, productName:`${productName} — ${v.label}`,
      salePrice:v.sale_price, qty:1, stock:v.stock });
  }
  paintCaisse();
}
function setQty(variantId, qty){
  const line = CAISSE.cart.find(x=>x.variantId === variantId);
  if(!line) return;
  if(qty <= 0) CAISSE.cart = CAISSE.cart.filter(x=>x.variantId !== variantId);
  else line.qty = Math.min(qty, line.stock);
  paintCaisse();
}
function tapProduct(p){
  if(p.variants.length === 1) addVariant(p.variants[0], p.name);
  else openVariantPicker(p);
}

function openVariantPicker(p){
  const box = document.createElement("div");
  box.innerHTML = `<p class="muted" style="margin-bottom:12px">Choisis le format :</p>` +
    p.variants.map(v=>{
      const out = v.stock <= 0;
      const st  = stockStatus(v.stock, v.min_stock);
      return `<button class="card" ${out?"disabled":""} data-vid="${v.id}"
        style="display:flex;width:100%;align-items:center;justify-content:space-between;padding:16px;
               margin-bottom:10px;cursor:${out?"not-allowed":"pointer"};opacity:${out?.4:1};text-align:left">
        <div>
          <div class="fd" style="font-size:20px">${esc(v.label)}</div>
          <div style="font-size:12px">${out
            ? '<span style="color:var(--out)">Épuisé</span>'
            : `<span style="color:${st==="low"?"var(--low)":"var(--ok)"}">${v.stock} en stock</span>`}</div>
        </div>
        <span class="fm violet-text" style="font-size:20px;font-weight:700">${euro(v.sale_price)}</span>
      </button>`;
    }).join("") +
    `<div class="modal-foot" data-modal-actions><button class="btn secondary" data-close-modal>Fermer</button></div>`;

  box.querySelectorAll("button[data-vid]").forEach(b=>{
    if(b.disabled) return;
    b.onclick = () => { addVariant(p.variants.find(x=>x.id===b.dataset.vid), p.name); closeModal(); };
  });

  const ov = openModal({ title:p.name, body:box, showFooterClose:false });
  bindCloseButtons(ov);
}

async function validateSale(){
  if(!CAISSE.cart.length || CAISSE.submitting) return;
  CAISSE.submitting = true; paintCaisse();
  try{
    const res = await Sales.create(CAISSE.cart);
    toast(`Vente enregistrée · ${euro(res.total)} · ${res.item_count} article(s)`);
    CAISSE.cart = []; CAISSE.drawerOpen = false;
    CAISSE.products = await Products.listActive();   // rafraîchit les stocks
  }catch(e){
    toast(e.message, "error");
  }finally{
    CAISSE.submitting = false; paintCaisse();
  }
}

/* ---------- Rendu du panier ---------- */
function cartHTML(){
  if(!CAISSE.cart.length){
    return `<div class="cart-empty">${icon("cart",40)}<p style="margin-top:10px">Tape un produit pour l'ajouter</p></div>`;
  }
  const lines = CAISSE.cart.map(l=>`
    <div class="cart-line">
      <div class="row between gap-2" style="align-items:flex-start">
        <div style="min-width:0;flex:1">
          <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l.productName)}</div>
          <div class="fm muted" style="font-size:12px">${euro(l.salePrice)} × ${l.qty} = <span class="violet-text">${euro(l.salePrice*l.qty)}</span></div>
        </div>
        <button class="qty-btn" style="width:30px;height:30px;border:none;background:none;color:var(--text-muted)" data-rm="${l.variantId}">${icon("trash",15)}</button>
      </div>
      <div class="row gap-2" style="margin-top:8px">
        <button class="qty-btn" data-dec="${l.variantId}">${icon("minus",16)}</button>
        <span class="fm" style="width:32px;text-align:center;font-size:18px;font-weight:700">${l.qty}</span>
        <button class="qty-btn" data-inc="${l.variantId}" ${l.qty>=l.stock?"disabled":""}>${icon("plus",16)}</button>
        ${l.qty>=l.stock ? '<span class="muted" style="font-size:10px;text-transform:uppercase;color:var(--low)">max</span>' : ""}
      </div>
    </div>`).join("");

  const prep = CAISSE.cart.map(l=>`
    <div class="row between">
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l.productName)}</span>
      <span class="violet-text" style="margin-left:8px;flex-shrink:0">×${l.qty}</span>
    </div>`).join("");

  return `
    <div class="cart-head">
      <div class="row gap-2">${icon("cart",20)}<span class="fd" style="font-size:20px">Panier</span>
        ${cartCount() ? `<span class="pill" style="border-radius:999px;padding:2px 8px">${cartCount()}</span>` : ""}
      </div>
      <button class="btn ghost sm" data-clear>Vider</button>
    </div>
    <div class="cart-lines">${lines}</div>
    <div class="cart-foot">
      <div style="background:var(--bg);border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:4px">À préparer</div>
        <div class="fm" style="font-size:14px;display:flex;flex-direction:column;gap:2px">${prep}</div>
      </div>
      <div class="row between" style="align-items:flex-end;margin-bottom:12px">
        <span class="muted" style="text-transform:uppercase;font-size:14px">Total</span>
        <span class="fm violet-text" style="font-size:30px;font-weight:700">${euro(cartTotal())}</span>
      </div>
      <button class="btn xl" data-validate ${CAISSE.submitting?"disabled":""}>${CAISSE.submitting?"Enregistrement…":"✓ Valider"}</button>
      <p class="center muted" style="margin-top:8px;font-size:11px">Paiement à encaisser sur le TPE</p>
    </div>`;
}

function bindCart(scope){
  scope.querySelectorAll("[data-inc]").forEach(b=>b.onclick = ()=>{
    const l = CAISSE.cart.find(x=>x.variantId===b.dataset.inc); setQty(b.dataset.inc, l.qty+1);
  });
  scope.querySelectorAll("[data-dec]").forEach(b=>b.onclick = ()=>{
    const l = CAISSE.cart.find(x=>x.variantId===b.dataset.dec); setQty(b.dataset.dec, l.qty-1);
  });
  scope.querySelectorAll("[data-rm]").forEach(b=>b.onclick = ()=>setQty(b.dataset.rm, 0));
  const clear = scope.querySelector("[data-clear]");
  if(clear) clear.onclick = ()=>{ CAISSE.cart = []; paintCaisse(); };
  const validate = scope.querySelector("[data-validate]");
  if(validate) validate.onclick = validateSale;
}

/* ---------- Rendu global ---------- */
function paintCaisse(){
  const catTabs = `<div class="cat-tabs">
    <button class="cat-tab ${CAISSE.activeCat==="all"?"active":""}" data-cat="all">🔊 Tout</button>
    ${caisseCats().map(c=>`<button class="cat-tab ${CAISSE.activeCat===c.slug?"active":""}" data-cat="${c.slug}"><span>${c.icon}</span>${esc(c.name)}</button>`).join("")}
  </div>`;

  const products = caisseFiltered();
  const grid = products.length ? `<div class="products-grid">${products.map(p=>{
    const totalStock = p.variants.reduce((s,v)=>s+v.stock, 0);
    const out = totalStock <= 0;
    const minPrice = Math.min(...p.variants.map(v=>v.sale_price));
    const multi = p.variants.length > 1;
    const anyOk = p.variants.some(v=>stockStatus(v.stock,v.min_stock) === "ok");
    const st = out ? "out" : anyOk ? "ok" : "low";
    const dot = st==="ok" ? "var(--ok)" : st==="low" ? "var(--low)" : "var(--out)";
    /* Photo de la 1re variante qui en a une, sinon emoji catégorie */
    const photo = p.variants.find(v=>v.photo_url)?.photo_url || null;
    const vis = productVisual(photo, p.category?.icon || "✨");
    return `<button class="pcard ${out?"out":""}" data-pid="${p.id}" ${out?"disabled":""}>
      <div class="img ${vis.cls}" style="${vis.style}">${vis.content}
        <span class="dot" style="background:${dot}"></span>
        ${out ? '<span class="out-tag"><span>Épuisé</span></span>' : ""}
      </div>
      <div class="body">
        <div class="name">${esc(p.name)}</div>
        <div class="price">${multi ? '<span class="muted" style="font-size:12px;font-weight:400">dès </span>' : ""}${euro(minPrice)}</div>
      </div>
    </button>`;
  }).join("")}</div>` : `<p class="center muted" style="padding:40px">Aucun produit dans cette catégorie.</p>`;

  App.root.innerHTML = `<div class="caisse-layout">
    <div><div class="banner"></div>${demoNote()}
      <div class="rush-bar">${logoHTML()}
        <div class="row gap-3">
          ${App.profile?.role === "admin" ? `<a href="#admin" class="btn secondary sm">Admin</a>` : ""}
          <span class="muted" style="font-size:14px">${esc(App.profile?.username||"")} <span class="pill">${esc(App.profile?.role||"")}</span></span>
          <button class="btn ghost sm" onclick="doSignOut()">${icon("logout",16)}<span>Sortir</span></button>
        </div>
      </div>
    </div>
    <div class="caisse-main">
      <div class="caisse-products">${catTabs}<div class="products-scroll">${grid}</div></div>
      <aside class="cart desktop">${cartHTML()}</aside>
    </div>
    ${cartCount() ? `<button class="cart-bar">
      <span class="row gap-2" style="font-weight:700">${icon("cart",20)} ${cartCount()} article(s)</span>
      <span class="fm" style="font-size:20px;font-weight:700">${euro(cartTotal())}</span>
    </button>` : ""}
    ${CAISSE.drawerOpen ? `<div class="cart-drawer"><div class="scrim"></div><div class="panel">${cartHTML()}</div></div>` : ""}
  </div>`;

  App.root.querySelectorAll("[data-cat]").forEach(b=>b.onclick = ()=>{ CAISSE.activeCat = b.dataset.cat; paintCaisse(); });
  App.root.querySelectorAll("[data-pid]").forEach(b=>{
    if(!b.disabled) b.onclick = ()=>tapProduct(CAISSE.products.find(p=>p.id===b.dataset.pid));
  });
  const bar = App.root.querySelector(".cart-bar");
  if(bar) bar.onclick = ()=>{ CAISSE.drawerOpen = true; paintCaisse(); };
  const scrim = App.root.querySelector(".cart-drawer .scrim");
  if(scrim) scrim.onclick = ()=>{ CAISSE.drawerOpen = false; paintCaisse(); };
  App.root.querySelectorAll(".cart").forEach(c=>bindCart(c));
  const panel = App.root.querySelector(".cart-drawer .panel");
  if(panel) bindCart(panel);
}
