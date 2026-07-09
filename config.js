/* ============================================================
   config.js — LE SEUL FICHIER À MODIFIER POUR BRANCHER LA BASE
   ============================================================
   Tant que SUPABASE_URL et SUPABASE_ANON_KEY sont vides,
   l'application tourne en MODE DÉMO (données locales d'exemple).

   Pour brancher ta vraie base :
   Supabase > Project Settings > API
     - "Project URL"  -> SUPABASE_URL
     - "anon public"  -> SUPABASE_ANON_KEY
   ============================================================ */

const DAHU_CONFIG = {
  SUPABASE_URL: "sb_publishable_5JtgQHSIAaVk_ouhMY_LnA_Fl9TXd7m",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndnJ6a3JsZ290enptd3VzemtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1OTQ5MzMsImV4cCI6MjA5OTE3MDkzM30.8RIPkPy6PiujS5m1-Dx4TXQKkOQcPgMowHrHXyOP6hk"
};

/* Bascule automatique : démo si la config est vide */
const DEMO_MODE = !DAHU_CONFIG.SUPABASE_URL || !DAHU_CONFIG.SUPABASE_ANON_KEY;

/* Comptes utilisables uniquement en mode démo */
const DEMO_ACCOUNTS = [
  { email: "admin@dahu.fr",  password: "admin",  username: "Théo", role: "admin"  },
  { email: "barman@dahu.fr", password: "barman", username: "Léo",  role: "barman" }
];
