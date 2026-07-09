/* ============================================================
   admin-reports.js — Historique & statistiques
   ============================================================ */

/* ---------------- HISTORIQUE ---------------- */
let _histTab = "ventes";

async function adminHistory(){
  setAdminContent(pageHead("Historique","Traçabilité complète") + `
    <div class="row wrap gap-3" style="margin-bottom:20px">
      <div class="row" style="border:1px solid var(--card-border);border-radius:10px;padding:4px">
        <button class="btn ${_histTab==="ventes"?"":"ghost"} sm" data-htab="ventes">Ventes</button>
        <button class="btn ${_histTab==="mouvements"?"":"ghost"} sm" data-htab="mouvements">Mouvements stock</button>
      </div>
      <div class="row gap-2 muted" style="font-size:14px">
        <span>Du</span><input class="input" type="date" id="h-from" style="width:auto">
        <span>au</span><input class="input" type="date" id="h-to" style="width:auto">
      </div>
    </div>
    <div id="hist-result"><div class="center muted" style="padding:30px"><div class="spinner" style="margin:0 auto"></div></div></div>`);

  document.querySelectorAll("[data-htab]").forEach(b=>b.onclick = ()=>{ _histTab = b.dataset.htab; adminHistory(); });
  const from = document.getElementById("h-from"), to = document.getElementById("h-to");
  from.onchange = load; to.onchange = load;

  async function load(){
    const res = document.getElementById("hist-result");
    if(_histTab === "ventes"){
      const sales = await Sales.list(from.value, to.value);
      res.innerHTML = sales.length
        ? `<div class="card" style="overflow-x:auto"><table>
            <thead><tr><th>Date</th><th>Articles</th><th>Détail</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${sales.map(s=>`<tr>
              <td class="fm muted" style="font-size:12px;white-space:nowrap">${fdatetime(s.created_at)}</td>
              <td>${s.item_count}</td>
              <td class="muted" style="font-size:12px">${(s.items||[]).map(it=>`${esc(it.product_name)} ×${it.qty}`).join(", ")}</td>
              <td style="text-align:right" class="fm violet-text">${euro(s.total)}</td>
            </tr>`).join("")}</tbody></table></div>`
        : `<div class="card pad center"><p class="muted">Aucune vente.</p></div>`;
    }else{
      const moves = await Stock.movements();
      res.innerHTML = moves.length
        ? `<div class="card" style="overflow-x:auto"><table>
            <thead><tr><th>Date</th><th>Produit</th><th>Type</th><th class="center">Variation</th><th class="center">Stock après</th><th>Motif</th></tr></thead>
            <tbody>${moves.map(m=>`<tr>
              <td class="fm muted" style="font-size:12px;white-space:nowrap">${fdatetime(m.created_at)}</td>
              <td>${esc(m.variant?.product?.name||"—")} <span class="muted">${m.variant?.label?"— "+esc(m.variant.label):""}</span></td>
              <td class="muted" style="font-size:14px">${movementLabel(m.type)}</td>
              <td class="center fm" style="font-weight:700;color:${m.qty_delta<0?"var(--out)":"var(--ok)"}">${m.qty_delta>0?"+":""}${m.qty_delta}</td>
              <td class="center fm">${m.stock_after}</td>
              <td class="muted" style="font-size:12px">${esc(m.reason||"—")}</td>
            </tr>`).join("")}</tbody></table></div>`
        : `<div class="card pad center"><p class="muted">Aucun mouvement.</p></div>`;
    }
  }
  load();
}

/* ---------------- STATISTIQUES ---------------- */
async function adminStats(){
  const [stats, top, daily] = await Promise.all([
    Stats.dashboard(), Stats.topProducts(8), Stats.dailyRevenue(14)
  ]);

  const card = (label,value)=>`<div class="card kpi"><div class="label">${label}</div><div class="value">${value}</div></div>`;
  const avg = stats.totalSales > 0 ? stats.totalRevenue/stats.totalSales : 0;

  const maxDaily = Math.max(1, ...daily.map(d=>d.revenue));
  const dailyBars = daily.length
    ? daily.map(d=>`<div class="bar-row">
        <span class="lbl fm">${d.day}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(d.revenue/maxDaily*100).toFixed(1)}%"></div></div>
        <span class="val">${euro(d.revenue)}</span></div>`).join("")
    : `<p class="center muted" style="padding:20px">Pas encore de données</p>`;

  const maxTop = Math.max(1, ...top.map(t=>t.qty));
  const topBars = top.length
    ? top.map(t=>`<div class="bar-row">
        <span class="lbl">${esc(t.product_name)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(t.qty/maxTop*100).toFixed(1)}%"></div></div>
        <span class="val">${t.qty}</span></div>`).join("")
    : `<p class="center muted" style="padding:20px">Pas encore de données</p>`;

  const topTable = top.length
    ? `<div class="card" style="overflow-x:auto;margin-top:24px"><table>
        <thead><tr><th>Produit</th><th class="center">Quantité</th><th style="text-align:right">CA généré</th></tr></thead>
        <tbody>${top.map(t=>`<tr><td>${esc(t.product_name)}</td><td class="center fm">${t.qty}</td>
          <td style="text-align:right" class="fm violet-text">${euro(t.revenue)}</td></tr>`).join("")}</tbody></table></div>`
    : "";

  setAdminContent(pageHead("Statistiques","Performance des ventes") + `
    <div class="grid" style="gap:24px">
      <div class="kpi-grid">
        ${card("CA total",euro(stats.totalRevenue))}
        ${card("Ventes",stats.totalSales)}
        ${card("CA du jour",euro(stats.todayRevenue))}
        ${card("Panier moyen",euro(avg))}
      </div>
      <div class="card pad"><h2 class="violet-text" style="font-size:24px;margin-bottom:18px">CA des 14 derniers jours</h2>${dailyBars}</div>
      <div class="card pad"><h2 class="violet-text" style="font-size:24px;margin-bottom:18px">Top produits (quantités)</h2>${topBars}</div>
      ${topTable}
    </div>`);
}
