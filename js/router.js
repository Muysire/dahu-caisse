/* ============================================================
   router.js — Routeur par hash (#menu, #login, #caisse, #admin/x)
   ============================================================ */

const App = {
  profile: null,
  root: null
};

function go(hash){
  if(location.hash === hash) route();
  else location.hash = hash;
}

window.addEventListener("hashchange", route);

async function route(){
  const hash = (location.hash || "#menu").slice(1);
  const [screen] = hash.split("/");

  /* Écrans protégés */
  if(screen === "caisse" && !App.profile){ location.hash = "#login"; return; }
  if(screen === "admin"){
    if(!App.profile){ location.hash = "#login"; return; }
    if(App.profile.role !== "admin"){ location.hash = "#caisse"; return; }
  }

  try{
    if(screen === "login")  return renderLogin();
    if(screen === "caisse") return renderCaisse();
    if(screen === "admin")  return renderAdmin();
    return renderMenu();
  }catch(e){
    App.root.innerHTML = `<div class="center-screen">
      <p style="color:var(--out)">Erreur : ${esc(e.message)}</p>
      <button class="btn" onclick="location.hash='#menu'">Retour</button>
    </div>`;
  }
}

async function doSignOut(){
  try{ await Auth.signOut(); }catch(e){ /* on déconnecte quand même */ }
  App.profile = null;
  location.hash = "#login";
}

/* Affiche une erreur lisible dans #app (au lieu du spinner infini) */
function showStartupError(message, hint){
  const root = document.getElementById("app");
  if(!root) return;
  root.innerHTML = `<div class="center-screen" style="padding:24px;text-align:center">
    <div class="logo-mark lg">D</div>
    <p style="color:var(--out);max-width:520px;font-weight:600">${esc(message)}</p>
    ${hint ? `<p class="muted" style="max-width:520px;font-size:14px">${esc(hint)}</p>` : ""}
    <button class="btn" onclick="location.reload()">Recharger</button>
  </div>`;
}

/* ---------- Démarrage ---------- */
async function boot(){
  /* Contrôle d'intégrité : tous les fichiers CSS/JS sont-ils bien arrivés ?
     Si non, index.html affiche un diagnostic précis et on NE démarre PAS
     (mieux vaut un message clair qu'un site à moitié cassé). */
  if(typeof __checkIntegrity === "function" && !__checkIntegrity()) return;

  App.root = document.getElementById("app");

  /* Signale à index.html que l'application a bien démarré :
     sans cet appel, l'écran de diagnostic s'afficherait à tort. */
  if(typeof __booted === "function") __booted();

  /* Une session invalide ne doit jamais bloquer le site sur "Chargement…" */
  try{
    App.profile = await Auth.current();
  }catch(e){
    console.error("Session illisible :", e);
    App.profile = null;
    try{ localStorage.removeItem("dahu-session"); }catch(_){}
  }

  try{
    await route();
  }catch(e){
    console.error(e);
    showStartupError(
      "Le site n'a pas pu s'afficher : " + e.message,
      "Vérifie js/core/config.js, puis recharge avec Ctrl+Maj+R."
    );
  }
}

(function start(){
  const launch = () => {
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  };

  /* Erreur de saisie dans config.js : on prévient au lieu de basculer
     silencieusement en mode démo (le pire des scénarios : tu crois
     travailler sur ta vraie base alors que non). */
  if(typeof DAHU_CONFIG_ERROR !== "undefined" && DAHU_CONFIG_ERROR){
    const show = () => {
      if(typeof __booted === "function") __booted();
      showStartupError("Erreur dans js/core/config.js", DAHU_CONFIG_ERROR);
    };
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
    else show();
    return;
  }

  if(!DEMO_MODE){
    /* Charge le SDK Supabase, puis démarre */
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    s.onload = launch;
    s.onerror = () => {
      if(typeof __booted === "function") __booted();   // stoppe le diagnostic générique
      showStartupError(
        "Impossible de charger Supabase.",
        "Vérifie ta connexion Internet. Pour repasser en mode démo, remets SUPABASE_URL et SUPABASE_ANON_KEY à \"\" dans js/core/config.js."
      );
    };
    document.head.appendChild(s);

    /* Si le CDN ne répond ni onload ni onerror (réseau filtré) */
    setTimeout(() => {
      if(!App.root && typeof window.supabase === "undefined"){
        if(typeof __booted === "function") __booted();
        showStartupError(
          "Supabase n'a pas répondu.",
          "Le site n'arrive pas à joindre cdn.jsdelivr.net. Vérifie ta connexion ou repasse en mode démo."
        );
      }
    }, 12000);
  }else{
    launch();
  }
})();
