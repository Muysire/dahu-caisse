/* ============================================================
   page-menu.js — La carte (menu public, sans achat en ligne)
   ============================================================ */

async function renderMenu(){
  App.root.innerHTML = `<div class="banner"></div>${demoNote()}
    <header class="hero">
      <div style="display:flex;justify-content:center;margin-bottom:14px"><div class="logo-mark lg">D</div></div>
      <h1 class="fd">LA CARTE</h1>
      <p class="fm" style="margin-top:8px;letter-spacing:3px;text-transform:uppercase;font-size:12px;color:var(--text-muted)">
        Dahu Sound System · Bar associatif
      </p>
      <a href="#login" class="btn" style="position:absolute;right:16px;top:16px">${icon("login",16)}<span>Connexion</span></a>
    </header>
    <main style="max-width:1100px;margin:0 auto;padding:40px 16px" id="menu-root">
      <p class="center muted">Chargement…</p>
    </main>
    <footer style="border-top:1px solid var(--card-border);padding:32px 16px;text-align:center">
      <div class="divider" style="max-width:280px;margin:0 auto 16px"></div>
      <div class="fd violet-text" style="font-size:22px;letter-spacing:3px">Dahu Sound System</div>
      <p class="muted" style="font-size:12px;margin-top:4px">Association loi 1901 · One Love, One Sound</p>
    </footer>`;

  const root = document.getElementById("menu-root");
  const products = await Products.listPublic();

  if(!products.length){
    root.innerHTML = `<div class="card pad center"><p class="muted">La carte n'est pas encore disponible.</p></div>`;
    return;
  }

  /* Regroupe par catégorie */
  const groups = new Map();
  for(const p of products){
    const key = p.category?.slug || "autres";
    const g = groups.get(key) || { name:p.category?.name||"Autres", icon:p.category?.icon||"✨", items:[] };
    g.items.push(p);
    groups.set(key, g);
  }

  let html = "";
  for(const g of groups.values()){
    html += `<section class="menu-section">
      <div class="row gap-2" style="margin-bottom:2px">
        <span style="font-size:24px">${g.icon}</span>
        <h2 class="fd violet-text" style="font-size:30px">${esc(g.name)}</h2>
      </div>
      <div class="divider"></div>
      <div class="menu-grid">`;

    for(const p of g.items){
      for(const v of p.variants){
        const st = stockStatus(v.stock, v.min_stock);
        const label = st==="out" ? "Épuisé" : st==="low" ? "Stock bas" : "Dispo";
        const vis = productVisual(v.photo_url, g.icon);   // photo si présente, sinon emoji
        html += `<div class="thumb">
          <div class="img ${vis.cls}" style="${vis.style}">${vis.content}</div>
          <div class="info">
            <div class="fd" style="font-size:18px">${esc(p.name)}</div>
            ${p.variants.length>1 ? `<div class="muted" style="font-size:12px">${esc(v.label)}</div>` : ""}
            <div class="row between" style="margin-top:8px">
              <span class="fm violet-text" style="font-size:17px;font-weight:700">${euro(v.sale_price)}</span>
              <span class="badge ${st}">${label}</span>
            </div>
          </div>
        </div>`;
      }
    }
    html += `</div></section>`;
  }
  root.innerHTML = html;
}
