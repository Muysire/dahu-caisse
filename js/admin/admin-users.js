/* ============================================================
   admin-users.js — Comptes : créer, changer le rôle,
   changer le mot de passe, désactiver, SUPPRIMER définitivement
   ============================================================ */

let _usersCache = [];

async function adminUsers(){
  _usersCache = await Users.list();

  const cards = _usersCache.map(u=>{
    const isSelf = u.id === App.profile?.id;
    return `<div class="card pad">
      <div class="row between" style="align-items:flex-start">
        <div class="row gap-2">
          <span style="color:var(--violet-light)">${icon(u.role==="admin"?"users":"package",20)}</span>
          <div>
            <div class="fd" style="font-size:20px">${esc(u.username)}${isSelf?' <span class="pill">moi</span>':""}</div>
            <p class="muted" style="font-size:11px;margin-top:2px">Créé le ${fdate(u.created_at)}</p>
          </div>
        </div>
      </div>

      <div class="row gap-2 wrap" style="margin-top:10px">
        <span class="badge violet">${u.role==="admin"?"Administrateur":"Barman"}</span>
        ${!u.active ? '<span class="badge out">Inactif</span>' : '<span class="badge ok">Actif</span>'}
      </div>

      <div class="row gap-2 wrap" style="margin-top:14px">
        <button class="btn secondary sm" data-pass="${u.id}">${icon("key",14)} Mot de passe</button>
        <button class="btn ghost sm" data-role="${u.id}">${u.role==="admin"?"→ Barman":"→ Admin"}</button>
        ${u.active
          ? `<button class="btn ghost sm" data-deact="${u.id}" ${isSelf?"disabled":""}>Désactiver</button>`
          : `<button class="btn ghost sm" data-react="${u.id}" style="color:var(--violet-light)">Réactiver</button>`}
        <button class="btn ghost sm" data-del="${u.id}" style="color:var(--out)" ${isSelf?"disabled":""}>${icon("trash",14)} Supprimer</button>
      </div>
    </div>`;
  }).join("");

  setAdminContent(pageHead("Utilisateurs","Admins & barmen",
    `<button class="btn" data-new-user>${icon("plus",18)} Nouvel utilisateur</button>`) + `
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${cards}</div>
    ${DEMO_MODE
      ? '<p class="muted" style="font-size:12px;margin-top:18px">ℹ️ En mode démo, les comptes sont fictifs et les mots de passe ne sont pas réellement changés. Configure Supabase pour de vrais comptes.</p>'
      : '<p class="muted" style="font-size:12px;margin-top:18px">⚠️ « Supprimer » efface définitivement le compte (profil + connexion). Cette action est irréversible.</p>'}`);

  document.querySelector("[data-new-user]").onclick = openUserForm;

  document.querySelectorAll("[data-pass]").forEach(b=>b.onclick = ()=>
    openSetPassword(_usersCache.find(u=>u.id===b.dataset.pass)));

  document.querySelectorAll("[data-role]").forEach(b=>b.onclick = async ()=>{
    const u = _usersCache.find(x=>x.id===b.dataset.role);
    const newRole = u.role === "admin" ? "barman" : "admin";
    const ok = await confirmDialog({ title:"Changer le rôle",
      message:`Passer ${u.username} en ${newRole === "admin" ? "administrateur" : "barman"} ?`, confirmLabel:"Changer" });
    if(!ok) return;
    try{ await Users.setRole(u.id, newRole); toast("Rôle mis à jour"); adminUsers(); }
    catch(e){ toast(e.message,"error"); }
  });

  document.querySelectorAll("[data-deact]").forEach(b=>{ if(b.disabled) return;
    b.onclick = async ()=>{
      const u = _usersCache.find(x=>x.id===b.dataset.deact);
      const ok = await confirmDialog({ title:"Désactiver le compte",
        message:`${u.username} ne pourra plus se connecter, mais son historique est conservé.`, confirmLabel:"Désactiver" });
      if(!ok) return;
      try{ await Users.setActive(u.id,false); toast("Utilisateur désactivé"); adminUsers(); }
      catch(e){ toast(e.message,"error"); }
    };
  });

  document.querySelectorAll("[data-react]").forEach(b=>b.onclick = async ()=>{
    try{ await Users.setActive(b.dataset.react,true); toast("Utilisateur réactivé"); adminUsers(); }
    catch(e){ toast(e.message,"error"); }
  });

  /* SUPPRESSION DÉFINITIVE : double confirmation */
  document.querySelectorAll("[data-del]").forEach(b=>{ if(b.disabled) return;
    b.onclick = async ()=>{
      const u = _usersCache.find(x=>x.id===b.dataset.del);
      const ok = await confirmDialog({
        title:"Supprimer définitivement",
        message:`Supprimer le compte « ${u.username} » de la base ? Le profil ET la connexion seront effacés. Cette action est IRRÉVERSIBLE. Préfère « Désactiver » si tu veux garder l'historique.`,
        confirmLabel:"Supprimer définitivement", danger:true
      });
      if(!ok) return;
      try{ await Users.remove(u.id); toast(`Compte « ${u.username} » supprimé`); adminUsers(); }
      catch(e){ toast(e.message,"error"); }
    };
  });
}

/* ---------- Créer un utilisateur ---------- */
function openUserForm(){
  let role = "barman";
  const box = document.createElement("div");

  function paint(){
    box.innerHTML = `
      <div class="row" style="border:1px solid var(--card-border);border-radius:10px;padding:4px;margin-bottom:16px">
        <button class="btn ${role==="barman"?"":"ghost"} sm" style="flex:1" data-r="barman">🍺 Barman</button>
        <button class="btn ${role==="admin"?"":"ghost"} sm" style="flex:1" data-r="admin">🔧 Admin</button>
      </div>
      <label class="field"><span>Nom d'utilisateur (affiché)</span><input class="input" id="u-name" placeholder="ex : Léo"></label>
      <label class="field"><span>Email de connexion</span><input class="input" type="email" id="u-email" placeholder="leo@dahu.fr"></label>
      <label class="field"><span>Mot de passe (6+ caractères)</span><input class="input" type="password" id="u-pass"></label>
      <p class="muted" style="background:var(--bg);border-radius:8px;padding:12px;font-size:12px">
        ${role==="barman" ? "Le barman n'aura accès qu'à la caisse." : "L'admin aura accès à tout le back-office."}
        Transmets-lui ses identifiants.
      </p>
      <div class="modal-foot" data-modal-actions>
        <button class="btn secondary" data-close-modal>Fermer</button>
        <button class="btn" id="u-save">Créer</button>
      </div>`;
    box.querySelectorAll("[data-r]").forEach(b=>b.onclick = ()=>{ role = b.dataset.r; paint(); });
    box.querySelector("#u-save").onclick = save;
    bindCloseButtons(box);
  }

  async function save(){
    const username = box.querySelector("#u-name").value.trim();
    const email    = box.querySelector("#u-email").value.trim();
    const password = box.querySelector("#u-pass").value;
    if(!username || !email || password.length < 6) return toast("Nom, email et mot de passe (6+) requis","error");
    try{
      const r = await Auth.createUser({ username, email, password, role });
      if(r.error) return toast(r.error,"error");
      toast(`Compte créé pour ${username}`);
      closeModal(); adminUsers();
    }catch(e){ toast(e.message,"error"); }
  }

  paint();
  const ov = openModal({ title:"Nouvel utilisateur", body:box, showFooterClose:false });
  bindCloseButtons(ov);
}

/* ---------- Changer le mot de passe d'un utilisateur ---------- */
function openSetPassword(user){
  const isSelf = user.id === App.profile?.id;
  const box = document.createElement("div");
  box.innerHTML = `
    <p class="muted" style="font-size:14px;margin-bottom:14px">Compte : <strong style="color:var(--text)">${esc(user.username)}</strong></p>
    <label class="field"><span>Nouveau mot de passe (6+ caractères)</span>
      <input class="input" type="password" id="sp-1" autocomplete="new-password"></label>
    <label class="field"><span>Confirmer</span>
      <input class="input" type="password" id="sp-2" autocomplete="new-password"></label>
    ${DEMO_MODE
      ? '<p class="muted" style="font-size:12px;background:var(--bg);padding:10px;border-radius:8px">ℹ️ Mode démo : le changement est simulé.</p>'
      : (isSelf
        ? ""
        : `<p class="muted" style="font-size:12px;background:var(--bg);padding:10px;border-radius:8px">
             Nécessite la fonction SQL <span class="fm">admin_set_password</span> (fournie dans database.sql).
             Sinon, utilise « Envoyer un lien de réinitialisation ».</p>`)}
    <div class="modal-foot" data-modal-actions>
      <button class="btn secondary" data-close-modal>Fermer</button>
      <button class="btn" id="sp-save">Changer</button>
    </div>`;

  box.querySelector("#sp-save").onclick = async ()=>{
    const p1 = box.querySelector("#sp-1").value, p2 = box.querySelector("#sp-2").value;
    if(p1.length < 6) return toast("6 caractères minimum","error");
    if(p1 !== p2)     return toast("Les mots de passe ne correspondent pas","error");
    try{
      /* Son propre mot de passe : passe par l'API auth standard */
      const r = isSelf ? await Auth.changeOwnPassword(p1) : await Users.setPassword(user.id, p1);
      if(r.error) return toast(r.error,"error");
      toast(r.demo ? "Mode démo : changement simulé" : `Mot de passe de ${user.username} modifié`);
      closeModal();
    }catch(e){ toast(e.message,"error"); }
  };

  const ov = openModal({ title:"Changer le mot de passe", body:box, showFooterClose:false });
  bindCloseButtons(ov);
}
