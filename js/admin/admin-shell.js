/* ============================================================
   admin-shell.js — Ossature du back-office : sidebar + routeur
   ============================================================ */

const ADMIN_NAV = [
  { id:"dashboard",    label:"Dashboard",    icon:"dashboard" },
  { id:"produits",     label:"Produits",     icon:"package"   },
  { id:"stock",        label:"Stock",        icon:"boxes"     },
  { id:"previsions",   label:"Prévisions",   icon:"trending"  },
  { id:"achats",       label:"Achats",       icon:"bag"       },
  { id:"fournisseurs", label:"Fournisseurs", icon:"truck"     },
  { id:"historique",   label:"Historique",   icon:"history"   },
  { id:"stats",        label:"Statistiques", icon:"chart"     },
  { id:"exports",      label:"Import/Export",icon:"download"  },
  { id:"utilisateurs", label:"Utilisateurs", icon:"users"     }
];

let ADMIN = { sidebarOpen:false };

function adminRoute(){
  const parts = (location.hash || "#admin/dashboard").slice(1).split("/");
  const sub = parts[1] || "dashboard";
  return ADMIN_NAV.find(n=>n.id===sub) ? sub : "dashboard";
}

function pageHead(title, subtitle, action=""){
  return `<div class="page-head">
    <div><h1>${esc(title)}</h1>${subtitle?`<div class="sub">${esc(subtitle)}</div>`:""}</div>
    ${action}
  </div>`;
}

function toggleSidebar(){ ADMIN.sidebarOpen = !ADMIN.sidebarOpen; paintAdminShell(); }

function paintAdminShell(){
  const current = adminRoute();
  const nav = ADMIN_NAV.map(n=>
    `<a class="nav-link ${current===n.id?"active":""}" href="#admin/${n.id}">${icon(n.icon,18)}<span>${n.label}</span></a>`
  ).join("");

  App.root.innerHTML = `${demoNote()}
    <div class="mobile-bar">${logoHTML()}<button class="btn ghost" onclick="toggleSidebar()">${icon("menu",26)}</button></div>
    <div class="admin-layout">
      ${ADMIN.sidebarOpen ? '<div class="scrim-admin" onclick="toggleSidebar()"></div>' : ""}
      <aside class="sidebar ${ADMIN.sidebarOpen?"open":""}">
        <div class="sidebar-head">${logoHTML()}</div>
        <nav class="sidebar-nav">${nav}</nav>
        <div class="sidebar-foot">
          <a href="#caisse" class="nav-link" style="color:var(--violet-light)">${icon("cart",18)}<span>Ouvrir la caisse</span></a>
          <button class="nav-link" onclick="openChangeOwnPassword()">${icon("key",18)}<span>Mon mot de passe</span></button>
          <div class="row between" style="padding:8px 14px">
            <span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(App.profile?.username||"")}</span>
            <button class="btn ghost sm" onclick="doSignOut()" style="padding:4px 8px">${icon("logout",14)} Sortir</button>
          </div>
        </div>
      </aside>
      <main class="admin-content" id="admin-content">
        <div class="center muted" style="padding:40px"><div class="spinner" style="margin:0 auto 14px"></div>Chargement…</div>
      </main>
    </div>`;

  App.root.querySelectorAll(".nav-link[href^='#admin']").forEach(a=>
    a.addEventListener("click", ()=>{ ADMIN.sidebarOpen = false; })
  );
}

function setAdminContent(html){ document.getElementById("admin-content").innerHTML = html; }

async function renderAdmin(){
  paintAdminShell();
  const map = {
    dashboard:    adminDashboard,
    produits:     adminProducts,
    stock:        adminStock,
    previsions:   adminForecasts,
    achats:       adminPurchases,
    fournisseurs: adminSuppliers,
    historique:   adminHistory,
    stats:        adminStats,
    exports:      adminExports,
    utilisateurs: adminUsers
  };
  try{
    await map[adminRoute()]();
  }catch(e){
    setAdminContent(`<div class="card pad"><p style="color:var(--out)">Erreur : ${esc(e.message)}</p></div>`);
  }
}

/* Changer son propre mot de passe (accessible à tous) */
function openChangeOwnPassword(){
  const box = document.createElement("div");
  box.innerHTML = `
    <label class="field"><span>Nouveau mot de passe (6+ caractères)</span>
      <input class="input" type="password" id="cp-1" autocomplete="new-password"></label>
    <label class="field"><span>Confirmer</span>
      <input class="input" type="password" id="cp-2" autocomplete="new-password"></label>
    ${DEMO_MODE?'<p class="muted" style="font-size:12px;background:var(--bg);padding:10px;border-radius:8px">ℹ️ En mode démo, le changement n\'est pas persistant.</p>':""}
    <div class="modal-foot" data-modal-actions>
      <button class="btn secondary" data-close-modal>Fermer</button>
      <button class="btn" id="cp-save">Changer</button>
    </div>`;
  box.querySelector("#cp-save").onclick = async ()=>{
    const p1 = box.querySelector("#cp-1").value, p2 = box.querySelector("#cp-2").value;
    if(p1.length < 6)  return toast("6 caractères minimum","error");
    if(p1 !== p2)      return toast("Les mots de passe ne correspondent pas","error");
    const r = await Auth.changeOwnPassword(p1);
    if(r.error) return toast(r.error,"error");
    toast(r.demo ? "Mode démo : changement simulé" : "Mot de passe modifié");
    closeModal();
  };
  const ov = openModal({ title:"Mon mot de passe", body:box, showFooterClose:false });
  bindCloseButtons(ov);
}
