# 🏔️ Dahu Caisse — Code source

## 🚀 Voir le site tout de suite

Double-clique sur **`index.html`**. Ça marche, sans rien installer.
Connexion : `admin@dahu.fr` / `admin`

---

## 📁 Structure des fichiers

```
dahu-caisse/
├── index.html              ← Point d'entrée (charge tout dans l'ordre)
│
├── css/
│   ├── 01-base.css         Variables (couleurs, polices), reset, utilitaires
│   ├── 02-components.css   Boutons, cartes, champs, badges, MODALES, toasts
│   ├── 03-layout-public.css  Connexion, menu public, caisse (POS)
│   └── 04-layout-admin.css   Back-office : sidebar, KPIs, contenu
│
├── js/
│   ├── core/
│   │   ├── config.js       ⚠️ LE SEUL FICHIER À MODIFIER (clés Supabase)
│   │   ├── utils.js        Formatage (€, dates), échappement, icônes SVG
│   │   ├── ui.js           Toasts, MODALES, confirmations, lecture d'images
│   │   ├── demo-data.js    Base d'exemple (mode démo, localStorage)
│   │   ├── csv.js          Export ET import CSV
│   │   ├── data-auth.js    Connexion, comptes (créer/supprimer/mot de passe)
│   │   └── data-catalog.js Produits, ventes, stock, fournisseurs, stats
│   │
│   ├── pages/
│   │   ├── page-login.js   Écran de connexion
│   │   ├── page-menu.js    La carte (public)
│   │   └── page-caisse.js  Caisse tactile
│   │
│   ├── admin/
│   │   ├── admin-shell.js      Sidebar + routeur du back-office
│   │   ├── admin-dashboard.js  KPIs, alertes stock, dernières ventes
│   │   ├── admin-products.js   Catalogue, variantes, PHOTOS
│   │   ├── admin-stock.js      Stock, prévisions, achats, fournisseurs
│   │   ├── admin-reports.js    Historique, statistiques
│   │   ├── admin-exports.js    Exports CSV + IMPORT du stock
│   │   └── admin-users.js      Comptes : rôle, mot de passe, suppression
│   │
│   └── router.js           Routeur (#menu, #login, #caisse, #admin/...)
│
├── database.sql            Base complète (première installation)
└── database-UPDATE.sql     Mise à jour (si database.sql déjà lancé)
```

### Où modifier quoi ?

| Je veux…                        | J'ouvre…                        |
|---------------------------------|---------------------------------|
| Brancher ma base Supabase       | `js/core/config.js`             |
| Changer une couleur / police    | `css/01-base.css`               |
| Modifier la caisse              | `js/pages/page-caisse.js`       |
| Ajouter une page admin          | `js/admin/admin-shell.js` + un nouveau fichier |
| Toucher aux règles d'import CSV | `js/core/csv.js`                |

> ℹ️ Les scripts sont chargés en `<script>` classiques (pas de modules ES6),
> **exprès** : c'est ce qui permet d'ouvrir le site en double-clic (`file://`).
> L'ordre de chargement dans `index.html` est important.

---

## ✨ Nouveautés de cette version

### 1. Import CSV du stock
`Admin → Import / Export`

1. Télécharge **« État du stock »** → tu obtiens `stock.csv`
2. Ouvre-le dans Excel, modifie les colonnes `Stock`, `Seuil`, `Prix vente`, `Prix achat`
3. Reviens sur la page, **glisse le fichier** dans la zone
4. Clique **Prévisualiser** (rien n'est encore modifié — tu vois le détail des changements)
5. Clique **Appliquer**

**Règles :**
- Les lignes sont retrouvées par **`Code`** (le plus fiable), sinon par **`Produit` + `Variante`**
- Une **colonne vide = valeur inchangée**
- Les virgules décimales (`2,80`) sont acceptées
- Les changements de stock sont **journalisés** (Historique → type « Inventaire », motif « Import CSV »)
- Une ligne inconnue est **signalée sans bloquer** le reste de l'import

### 2. Photo par article
`Admin → Produits → Éditer`

- Chaque **variante** a son bouton **Choisir** pour une photo
- L'image est **redimensionnée automatiquement** (400 px max) pour ne pas alourdir la base
- **Sans photo → l'emoji de la catégorie s'affiche** (🍺 bière, 🍿 snack…), comme avant
- La photo apparaît sur la **caisse** et sur le **menu public**

### 3. Gestion complète des utilisateurs
`Admin → Utilisateurs`

- **Mot de passe** : change celui de n'importe quel compte
- **Rôle** : bascule admin ⇄ barman
- **Désactiver** : le compte ne peut plus se connecter, l'historique est conservé
- **Supprimer** : efface **définitivement** le profil ET la connexion (double confirmation)
- 🔒 Impossible de se supprimer ou se désactiver soi-même

> Sur la vraie base, « Supprimer » et « Mot de passe » utilisent deux fonctions SQL
> (`delete_user`, `admin_set_password`) — elles sont dans `database.sql` et
> `database-UPDATE.sql`.

### 4. Modales : plus de fermeture accidentelle
Avant, si tu commençais à sélectionner du texte dans un champ et que tu relâchais
la souris **en dehors** de la fenêtre, elle se fermait et tu perdais ta saisie.

Corrigé : la fenêtre ne se ferme que si le clic **commence ET finit** sur le fond.
Il y a maintenant **deux boutons de fermeture explicites** : la croix **×** en haut
et le bouton **Fermer** en bas. La touche **Échap** fonctionne aussi.

---

## ⚙️ Le seul fichier à remplir

Tout le reste fonctionne sans y toucher. Ouvre **`js/core/config.js`** :

```js
const DAHU_CONFIG = {
  SUPABASE_URL: "https://xxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi..."
};
```

- **Les deux vides** → mode démo (données d'exemple locales, rien à installer)
- **Les deux remplies** → ta vraie base Supabase

Le fichier **vérifie ta saisie**. S'il manque une clé, si l'URL finit par un `/`,
si tu as collé la clé `service_role` par erreur… le site te l'affiche à l'écran
au lieu de basculer silencieusement en mode démo.

Les espaces collés par mégarde sont nettoyés automatiquement.

---

## 🗄️ Base de données

- **Première installation** → lance `database.sql`
- **Base déjà installée** (tu as eu l'erreur `duplicate key ... profiles_pkey`)
  → lance uniquement **`database-UPDATE.sql`**, il ajoute juste :
  - la colonne `photo_url`
  - le type de mouvement `import`
  - les fonctions `delete_user` et `admin_set_password`

> L'erreur `duplicate key` était **normale** : le trigger `handle_new_user` avait
> déjà créé ton profil automatiquement. Il fallait faire un `update`, pas un `insert`.

---

## 🌐 Mise en ligne sur GitHub Pages

Uploade **tout le dossier** (pas seulement `index.html` !), en gardant l'arborescence
`css/` et `js/`. Sur GitHub : **Add file → Upload files**, puis glisse le dossier entier.

Ensuite : **Settings → Pages → Branch : `main` / `(root)` → Save**.

⚠️ Le fichier d'entrée doit s'appeler exactement **`index.html`** (minuscules).

---

Fait avec 💜 pour **Dahu Sound System** — *One Love, One Sound, One Vibe.*
