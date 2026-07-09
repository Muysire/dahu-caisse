/* ============================================================
   admin-dashboard.js — Vue d'ensemble
   ============================================================ */

async function adminDashboard(){
  const [stats, products, recent] = await Promise.all([
    Stats.dashboard(), Products.listAll(), Sales.recent(8)
  ]);

  /* Alertes stock */
  const lows = [];
  for(const p of products){
    for(const v of p.variants){
      if(stockStatus(v.stock, v.min_stock) !== "ok"){
        lows.push({ name:p.name, label:v.label, stock:v.stock, min:v.min_stock });
      }
    }
  }
  lows.sort((a,b)=>a.stock-b.stock);

  const kpi = (ic,label,value,alert) => `<div class="card kpi">
    <div class="label"><span style="color:${alert?"var(--low)":"var(--violet-light)"}">${icon(ic,20)}</span>${label}</div>
    <div class="value" style="color:${alert?"var(--low)":"var(--text)"}">${value}</div>
  </div>`;

  const lowsHTML = lows.length
    ? lows.slice(0,8).map(v=>`<li class="row between" style="background:var(--bg);border-radius:10px;padding:9px 12px;margin-bottom:8px;list-style:none">
        <span style="font-size:14px">${esc(v.name)} <span class="muted">— ${esc(v.label)}</span></span>
        <span class="badge ${v.stock<=0?"out":"low"}">${v.stock} / ${v.min}</span>
      </li>`).join("")
    : `<p class="center" style="color:var(--ok);padding:20px">✓ Tous les stocks sont au vert</p>`;

  const salesHTML = recent.length
    ? recent.map(s=>`<li class="row between" style="background:var(--bg);border-radius:10px;padding:9px 12px;margin-bottom:8px;list-style:none">
        <span class="fm muted" style="font-size:12px">${fdatetime(s.created_at)}</span>
        <span style="font-size:14px">${s.item_count} art.</span>
        <span class="fm violet-text" style="font-weight:700">${euro(s.total)}</span>
      </li>`).join("")
    : `<p class="center muted" style="padding:20px">Aucune vente</p>`;

  setAdminContent(pageHead("Dashboard","Vue d'ensemble de la soirée") + `
    <div class="grid" style="gap:24px">
      <div class="kpi-grid">
        ${kpi("euro","CA du jour",euro(stats.todayRevenue))}
        ${kpi("cart","Ventes du jour",stats.todayCount)}
        ${kpi("trending","CA total",euro(stats.totalRevenue))}
        ${kpi("alert","Alertes stock",lows.length,lows.length>0)}
      </div>
      <div class="two-col">
        <div class="card pad">
          <div class="row between" style="margin-bottom:16px">
            <h2 class="violet-text" style="font-size:24px">Alertes stock</h2>
            <a href="#admin/stock" class="muted" style="font-size:14px">Gérer →</a>
          </div>
          <ul style="padding:0;margin:0">${lowsHTML}</ul>
        </div>
        <div class="card pad">
          <div class="row between" style="margin-bottom:16px">
            <h2 class="violet-text" style="font-size:24px">Dernières ventes</h2>
            <a href="#admin/historique" class="muted" style="font-size:14px">Tout voir →</a>
          </div>
          <ul style="padding:0;margin:0">${salesHTML}</ul>
        </div>
      </div>
    </div>`);
}
