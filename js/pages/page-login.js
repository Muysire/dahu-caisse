/* ============================================================
   page-login.js — Écran de connexion
   ============================================================ */

function renderLogin(){
  App.root.innerHTML = `
  <div class="banner"></div>${demoNote()}
  <div class="login-inner">
    <div style="margin-bottom:14px"><div class="logo-mark lg">D</div></div>
    <h1 class="fd violet-text" style="font-size:40px;letter-spacing:5px">DAHU CAISSE</h1>
    <p class="fm" style="margin:8px 0 28px;letter-spacing:3px;text-transform:uppercase;font-size:12px;color:var(--text-muted)">
      One Love · One Sound · One Vibe
    </p>
    <div class="card pad login-card">
      <label class="field"><span>Email</span>
        <input class="input" id="lg-email" type="email" placeholder="prenom@dahu.fr" value="${DEMO_MODE?"admin@dahu.fr":""}">
      </label>
      <label class="field"><span>Mot de passe</span>
        <input class="input" id="lg-pass" type="password" placeholder="••••••••" value="${DEMO_MODE?"admin":""}">
      </label>
      <button class="btn lg block" id="lg-btn">Se connecter</button>
      <p id="lg-err" class="hidden" style="margin-top:14px;padding:9px 12px;border-radius:10px;
        border:1px solid rgba(239,68,68,.4);background:rgba(239,68,68,.1);color:var(--out);font-size:14px;text-align:center"></p>
      <p class="muted center" style="margin-top:18px;font-size:12px">Barmen & admins se connectent ici.</p>
    </div>
    <a href="#menu" class="muted" style="margin-top:22px;font-size:14px">← Voir le menu public</a>
  </div>`;

  const email = document.getElementById("lg-email");
  const pass  = document.getElementById("lg-pass");
  const err   = document.getElementById("lg-err");
  const btn   = document.getElementById("lg-btn");

  async function login(){
    err.classList.add("hidden");
    btn.disabled = true; btn.textContent = "Connexion…";
    const { profile, error } = await Auth.signIn(email.value, pass.value);
    if(error || !profile){
      err.textContent = error || "Connexion impossible.";
      err.classList.remove("hidden");
      btn.disabled = false; btn.textContent = "Se connecter";
      return;
    }
    App.profile = profile;
    location.hash = profile.role === "admin" ? "#admin" : "#caisse";
  }

  btn.onclick = login;
  [email, pass].forEach(el => el.addEventListener("keydown", e => { if(e.key === "Enter") login(); }));
}
