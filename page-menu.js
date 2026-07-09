/* ============================================================
   ui.js — Toasts, modales, aide au formulaire
   ============================================================ */

/* ---------- Toasts ---------- */
function ensureToaster(){
  let t = document.getElementById("toaster");
  if(!t){ t = document.createElement("div"); t.id = "toaster"; document.body.appendChild(t); }
  return t;
}
function toast(msg, type="success"){
  const t = ensureToaster();
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<span>${type==="success"?"✓":"⚠"}</span><span>${esc(msg)}</span>`;
  t.appendChild(el);
  setTimeout(()=>{
    el.style.opacity="0"; el.style.transition="opacity .3s";
    setTimeout(()=>el.remove(),300);
  },3200);
}

/* ============================================================
   MODALES
   ------------------------------------------------------------
   PROBLÈME RÉSOLU ICI :
   Avant, un clic sur le fond fermait la modale. Or l'évènement
   "click" se déclenche au RELÂCHEMENT de la souris. Si on
   commençait une sélection de texte DANS la modale et qu'on
   relâchait HORS de la modale, elle se fermait toute seule.

   SOLUTION :
   1) On mémorise où le clic a COMMENCÉ (mousedown).
   2) On ne ferme que si le clic a commencé ET fini sur le fond.
   3) Un bouton "Fermer" explicite est toujours présent (croix
      en haut + bouton en bas de formulaire).
   ============================================================ */
let _mouseDownTarget = null;

function openModal({title, body, wide, showFooterClose = true}){
  closeModal();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "active-modal";
  overlay.innerHTML = `
    <div class="modal ${wide?"lg":""}">
      <div class="modal-head">
        <h2>${esc(title)}</h2>
        <button class="x-btn" data-close-modal title="Fermer (Échap)" aria-label="Fermer">×</button>
      </div>
      <div class="modal-body"></div>
    </div>`;

  const bodyEl = overlay.querySelector(".modal-body");
  bodyEl.appendChild(body);

  // Bouton "Fermer" explicite en bas, si le contenu n'a pas déjà ses propres actions
  if(showFooterClose && !body.querySelector("[data-modal-actions]")){
    const foot = document.createElement("div");
    foot.className = "modal-foot";
    foot.innerHTML = `<button class="btn secondary" data-close-modal>Fermer</button>`;
    bodyEl.appendChild(foot);
  }

  // 1) Mémorise l'origine du clic
  overlay.addEventListener("mousedown", e => { _mouseDownTarget = e.target; });

  // 2) Ne ferme QUE si le clic a commencé ET s'est terminé sur le fond
  overlay.addEventListener("mouseup", e => {
    if(e.target === overlay && _mouseDownTarget === overlay) closeModal();
    _mouseDownTarget = null;
  });

  // 3) Tous les boutons marqués [data-close-modal] ferment la modale
  overlay.querySelectorAll("[data-close-modal]").forEach(b => b.onclick = closeModal);

  document.body.appendChild(overlay);
  return overlay;
}

function closeModal(){
  const m = document.getElementById("active-modal");
  if(m) m.remove();
  _mouseDownTarget = null;
}

/* Échap ferme toujours */
document.addEventListener("keydown", e => { if(e.key === "Escape") closeModal(); });

/* Câble les boutons de fermeture ajoutés après coup (formulaires) */
function bindCloseButtons(scope){
  scope.querySelectorAll("[data-close-modal]").forEach(b => b.onclick = closeModal);
}

/* ---------- Confirmation stylée (remplace confirm()) ---------- */
function confirmDialog({title, message, confirmLabel="Confirmer", danger=false}){
  return new Promise(resolve=>{
    const box = document.createElement("div");
    box.innerHTML = `
      <p style="font-size:15px;line-height:1.5">${esc(message)}</p>
      <div class="modal-foot" data-modal-actions style="margin-top:20px">
        <button class="btn secondary" data-cancel>Annuler</button>
        <button class="btn ${danger?"danger":""}" data-ok>${esc(confirmLabel)}</button>
      </div>`;
    box.querySelector("[data-cancel]").onclick = ()=>{ closeModal(); resolve(false); };
    box.querySelector("[data-ok]").onclick   = ()=>{ closeModal(); resolve(true);  };
    const ov = openModal({title, body:box, showFooterClose:false});
    // La croix "×" vaut annulation
    ov.querySelector(".x-btn").onclick = ()=>{ closeModal(); resolve(false); };
  });
}

/* ---------- Lecture d'un fichier image -> base64 (data URL) ---------- */
function readImageAsDataUrl(file, maxSize = 400){
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith("image/")) return reject(new Error("Ce fichier n'est pas une image."));
    if(file.size > 5*1024*1024)          return reject(new Error("Image trop lourde (max 5 Mo)."));
    const reader = new FileReader();
    reader.onload = () => {
      // Redimensionne pour ne pas stocker une photo de 4000px
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize/Math.max(img.width,img.height));
        const w = Math.round(img.width*scale), h = Math.round(img.height*scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL("image/jpeg",0.82));
      };
      img.onerror = () => reject(new Error("Image illisible."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}
