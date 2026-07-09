/* ============================================================
   04-layout-admin.css — Back-office : sidebar, contenu, KPIs
   ============================================================ */

.admin-layout{display:flex;min-height:100vh}

/* ---------- Sidebar ---------- */
.sidebar{width:240px;flex-shrink:0;border-right:1px solid var(--card-border);background:var(--bg);
  display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
.sidebar-head{padding:18px 16px;border-bottom:1px solid var(--card-border)}
.sidebar-nav{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:4px}
.sidebar-foot{border-top:1px solid var(--card-border);padding:12px}

.nav-link{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;
  color:var(--text-muted);font-weight:600;font-size:15px;cursor:pointer;transition:all .12s;
  border:none;background:none;font-family:var(--fb);text-align:left;width:100%}
.nav-link:hover{background:var(--card);color:var(--violet-light)}
.nav-link.active{background:var(--violet);color:#fff;box-shadow:var(--glow)}
.nav-link svg{width:18px;height:18px}

/* ---------- Contenu ---------- */
.admin-content{flex:1;padding:26px 32px;overflow-x:hidden}
.page-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px;
  border-bottom:1px solid var(--card-border);padding-bottom:16px;margin-bottom:24px}
.page-head h1{font-size:38px;color:var(--violet-light)}
.page-head .sub{margin-top:4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:var(--text-muted)}

/* ---------- KPIs ---------- */
.kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
@media(min-width:1024px){.kpi-grid{grid-template-columns:repeat(4,1fr)}}
.kpi{padding:16px}
.kpi .label{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;
  text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)}
.kpi .value{margin-top:8px;font-family:var(--fm);font-size:26px;font-weight:700}

/* ---------- Colonnes ---------- */
.two-col{display:grid;gap:24px}
@media(min-width:1024px){.two-col{grid-template-columns:1fr 1fr}}

/* ---------- Variantes (formulaire produit) ---------- */
.variant-box{border:1px solid var(--card-border);border-radius:12px;background:var(--bg);
  padding:16px;margin-bottom:14px}

/* ---------- Mobile ---------- */
.mobile-bar{display:none}
@media(max-width:1023px){
  .sidebar{display:none}
  .sidebar.open{display:flex;position:fixed;z-index:70;left:0;top:0;bottom:0;animation:slideIn .2s ease}
  .mobile-bar{display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;
    padding:12px 16px;border-bottom:1px solid var(--card-border);
    background:rgba(10,7,16,.95);backdrop-filter:blur(8px)}
  .admin-content{padding:18px 16px}
  .scrim-admin{position:fixed;inset:0;z-index:65;background:rgba(0,0,0,.6)}
}
