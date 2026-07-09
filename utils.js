/* ============================================================
   data-auth.js — Client Supabase, connexion, gestion des comptes
   ============================================================ */

let _sb = null;
function sb(){
  if(DEMO_MODE) return null;
  if(!_sb) _sb = window.supabase.createClient(DAHU_CONFIG.SUPABASE_URL, DAHU_CONFIG.SUPABASE_ANON_KEY);
  return _sb;
}

const Auth = {
  async signIn(email, password){
    if(DEMO_MODE){
      const acc = DEMO_ACCOUNTS.find(a => a.email === email.trim().toLowerCase() && a.password === password);
      if(!acc) return { error:"Email ou mot de passe incorrect." };
      const session = { id: acc.role==="admin"?"demo-admin":"demo-barman", username:acc.username, role:acc.role, email:acc.email };
      localStorage.setItem("dahu-session", JSON.stringify(session));
      return { profile: session };
    }
    const { data, error } = await sb().auth.signInWithPassword({ email:email.trim(), password });
    if(error || !data.user) return { error:"Email ou mot de passe incorrect." };
    const { data: profile } = await sb().from("profiles").select("*").eq("id", data.user.id).single();
    if(!profile)          return { error:"Compte sans profil. Contacte l'administrateur." };
    if(!profile.active)   return { error:"Ce compte est désactivé." };
    return { profile };
  },

  async current(){
    if(DEMO_MODE){
      try{ return JSON.parse(localStorage.getItem("dahu-session")); }catch(e){ return null; }
    }
    const { data:{ user } } = await sb().auth.getUser();
    if(!user) return null;
    const { data } = await sb().from("profiles").select("*").eq("id", user.id).single();
    return data;
  },

  async signOut(){
    if(DEMO_MODE){ localStorage.removeItem("dahu-session"); return; }
    await sb().auth.signOut();
  },

  /* Création d'un compte depuis l'app (sans clé service_role) */
  async createUser({ username, email, password, role }){
    if(DEMO_MODE){
      const db = DemoDB.load();
      db.profiles.unshift({ id:uid(), username, role, active:true, created_at:new Date().toISOString() });
      DemoDB.save();
      return { ok:true };
    }
    /* Client isolé : évite d'écraser la session admin en cours */
    const iso = window.supabase.createClient(DAHU_CONFIG.SUPABASE_URL, DAHU_CONFIG.SUPABASE_ANON_KEY,
      { auth:{ persistSession:false, autoRefreshToken:false } });
    const { error } = await iso.auth.signUp({ email:email.trim(), password, options:{ data:{ username, role } } });
    if(error) return { error:error.message };
    return { ok:true };
  },

  /* Changer SON PROPRE mot de passe */
  async changeOwnPassword(newPassword){
    if(DEMO_MODE) return { ok:true, demo:true };
    const { error } = await sb().auth.updateUser({ password:newPassword });
    if(error) return { error:error.message };
    return { ok:true };
  },

  /* Envoyer un lien de réinitialisation à un autre utilisateur */
  async sendPasswordReset(email){
    if(DEMO_MODE) return { ok:true, demo:true };
    const { error } = await sb().auth.resetPasswordForEmail(email.trim(), { redirectTo: location.href });
    if(error) return { error:error.message };
    return { ok:true };
  }
};

const Users = {
  async list(){
    if(DEMO_MODE) return DemoDB.load().profiles.slice();
    const { data } = await sb().from("profiles").select("*").order("created_at",{ ascending:false });
    return data || [];
  },

  async setActive(id, active){
    if(DEMO_MODE){
      const db = DemoDB.load();
      const u = db.profiles.find(x=>x.id===id);
      if(u) u.active = active;
      DemoDB.save(); return;
    }
    const { error } = await sb().from("profiles").update({ active }).eq("id", id);
    if(error) throw new Error(error.message);
  },

  async setRole(id, role){
    if(DEMO_MODE){
      const db = DemoDB.load();
      const u = db.profiles.find(x=>x.id===id);
      if(u) u.role = role;
      DemoDB.save(); return;
    }
    const { error } = await sb().from("profiles").update({ role }).eq("id", id);
    if(error) throw new Error(error.message);
  },

  /* SUPPRESSION DÉFINITIVE (profil + compte auth via fonction SQL) */
  async remove(id){
    if(DEMO_MODE){
      const db = DemoDB.load();
      db.profiles = db.profiles.filter(u=>u.id!==id);
      DemoDB.save(); return;
    }
    const { error } = await sb().rpc("delete_user", { p_user_id:id });
    if(error) throw new Error(error.message);
  },

  /* Changer le mot de passe d'un AUTRE utilisateur (admin, via fonction SQL) */
  async setPassword(id, newPassword){
    if(DEMO_MODE) return { ok:true, demo:true };
    const { error } = await sb().rpc("admin_set_password", { p_user_id:id, p_new_password:newPassword });
    if(error) return { error:error.message };
    return { ok:true };
  }
};
