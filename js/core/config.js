/* ============================================================================
   config.js — LE SEUL FICHIER À MODIFIER
   ----------------------------------------------------------------------------
   Tant que les deux valeurs ci-dessous sont vides, le site tourne en
   MODE DÉMO (données d'exemple locales, rien à installer).

   Pour brancher ta vraie base de données :
     1. Supabase > SQL Editor > colle "database.sql" > Run
     2. Supabase > Project Settings > API
          "Project URL"  -> SUPABASE_URL
          "anon public"  -> SUPABASE_ANON_KEY
     3. Colle-les entre les guillemets, enregistre, recharge la page.

   ⚠️ Il faut remplir LES DEUX ou AUCUNE. Ne colle jamais la clé
      "service_role" ici : elle donnerait tous les droits à n'importe qui.
   ============================================================================ */

const DAHU_CONFIG = {

  SUPABASE_URL: "",

  SUPABASE_ANON_KEY: ""

};


/* ============================================================================
   À PARTIR D'ICI, NE RIEN MODIFIER
   ============================================================================ */

/* Nettoie les espaces / retours à la ligne collés par mégarde */
DAHU_CONFIG.SUPABASE_URL      = String(DAHU_CONFIG.SUPABASE_URL      || "").trim();
DAHU_CONFIG.SUPABASE_ANON_KEY = String(DAHU_CONFIG.SUPABASE_ANON_KEY || "").trim();

const _u = DAHU_CONFIG.SUPABASE_URL;
const _k = DAHU_CONFIG.SUPABASE_ANON_KEY;

/* Vérifie les erreurs de saisie les plus courantes.
   Reste null si tout va bien (ou si on est en mode démo). */
const DAHU_CONFIG_ERROR = (function(){
  if(!_u && !_k) return null;                    // mode démo : normal

  if(_u && !_k) return "SUPABASE_URL est rempli mais SUPABASE_ANON_KEY est vide. Remplis les deux, ou laisse les deux vides pour le mode démo.";
  if(_k && !_u) return "SUPABASE_ANON_KEY est rempli mais SUPABASE_URL est vide. Remplis les deux, ou laisse les deux vides pour le mode démo.";

  if(!/^https:\/\//.test(_u))
    return "SUPABASE_URL doit commencer par https:// — valeur actuelle : " + _u;

  if(/\/$/.test(_u))
    return "SUPABASE_URL ne doit pas finir par un / — enlève-le.";

  if(!/^eyJ/.test(_k))
    return "SUPABASE_ANON_KEY semble incorrecte : une clé Supabase commence toujours par « eyJ ».";

  if(/service_role/.test(_k))
    return "Tu as collé la clé service_role. Utilise la clé « anon public », jamais celle-ci.";

  return null;
})();

/* Bascule automatique : démo si la config est vide */
const DEMO_MODE = !_u || !_k;

/* Comptes utilisables uniquement en mode démo */
const DEMO_ACCOUNTS = [
  { email: "admin@dahu.fr",  password: "admin",  username: "Théo", role: "admin"  },
  { email: "barman@dahu.fr", password: "barman", username: "Léo",  role: "barman" }
];
