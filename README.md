# 🏔️ Dahu Caisse

Application de **caisse et gestion de stock** pour les événements de **Dahu Sound System**.
Interface tactile pour le rush, ventes fiables même à plusieurs barmen, stock en temps réel, statistiques et exports comptables.

- **Caisse** : prise de commande rapide, panier, validation (paiement encaissé à part sur le TPE).
- **Stock** : réapprovisionnement, inventaire, corrections, alertes de seuil.
- **Admin** : produits & variantes, fournisseurs, achats, prévisions, historique, stats, exports CSV, utilisateurs.
- **Menu public** : la carte consultable sans connexion (sans achat en ligne).

Stack : **Next.js 15 (export statique) · TypeScript · Tailwind · Supabase**.
Hébergement **100 % gratuit** : **GitHub Pages** (le site) + **Supabase** (base de données, comptes, photos). **Aucun serveur, aucune carte bancaire.**

---

## 🎯 Comment ça marche

```
  [Téléphone / Tablette / PC]
            │
            ▼
   Site statique (HTML/CSS/JS)  ───►  hébergé gratuitement sur GITHUB PAGES
            │
            ▼
   Base de données + Comptes + Photos  ───►  SUPABASE (gratuit)
```

Toute la logique tourne dans le navigateur et parle directement à Supabase.
La sécurité est assurée par Supabase (authentification + règles d'accès **RLS** en base) : même si tout le code est public, **personne ne peut lire ou modifier ce qu'il n'a pas le droit de voir**.

---

## ✅ Ce qu'il te faut (gratuit)

1. Un compte **GitHub** → https://github.com
2. Un compte **Supabase** → https://supabase.com
3. **Node.js 18.18+** (seulement si tu veux tester en local — facultatif) → https://nodejs.org

---

## 🚀 Installation pas à pas

> Compte ~30 min la première fois. Suis les étapes **dans l'ordre**.

### Étape 1 — Créer le projet Supabase

1. https://supabase.com → **Start your project** → connecte-toi.
2. **New project**.
   - **Name** : `dahu-caisse`
   - **Database Password** : choisis un mot de passe **fort** et **note-le**.
   - **Region** : **Europe** (Paris / Frankfurt).
   - **Plan** : **Free**.
3. **Create new project**, patiente ~2 min.

### Étape 2 — Créer les tables (SQL)

Dans Supabase → **SQL Editor** → pour chaque fichier : **New query**, colle le contenu, **Run**.
**Respecte cet ordre :**

| Ordre | Fichier (dossier `database/`) | Rôle |
|------|-------------------------------|------|
| 1 | `schema.sql` | Crée les tables |
| 2 | `functions.sql` | Fonctions + création auto des profils |
| 3 | `rls.sql` | Sécurité (qui voit/fait quoi) |
| 4 | `seed.sql` | (Optionnel) Produits de démo |

### Étape 3 — Créer le bucket de photos

**Storage** → **New bucket** → nom **`photos`** (exactement) → coche **Public bucket** → **Create**.

### Étape 4 — Récupérer tes clés Supabase

**Project Settings** (roue dentée) → **API**. Note :
- **Project URL** (ex. `https://abcd1234.supabase.co`)
- **anon public** (clé publique)

> Pas besoin de la clé `service_role` dans cette version : il n'y a aucun serveur. 👍

### Étape 5 — Autoriser les comptes & l'URL GitHub Pages

1. **Authentication** → **Providers** → **Email** : assure-toi qu'il est **activé**.
2. **Authentication** → **Sign In / Up** (ou **Settings**) :
   - Pour la mise en route, **désactive "Confirm email"** (les barmen n'ont pas forcément d'email réel). Ainsi un compte créé est utilisable tout de suite.
3. **Authentication** → **URL Configuration** → **Site URL** : mets l'adresse de ton futur site, par exemple
   `https://TON-PSEUDO.github.io/dahu-caisse/`
   (tu pourras y revenir une fois l'URL connue à l'étape 8).

### Étape 6 — Créer ton premier compte ADMIN

1. **Authentication** → **Users** → **Add user** → **Create new user**.
   - **Email** : ton email (ex. `theo@dahu.fr`)
   - **Password** : ton mot de passe
   - Coche **Auto Confirm User**
   - **Create user**, puis **copie son `User UID`**.
2. **SQL Editor** → **New query**, colle ceci (remplace l'UID), **Run** :
   ```sql
   insert into profiles (id, username, role, active)
   values ('COLLE-ICI-LE-USER-UID', 'theo', 'admin', true);
   ```

> Ensuite tu crées **tous les autres comptes depuis l'app** (page **Admin → Utilisateurs**), barmen comme admins. Plus de SQL à faire.

### Étape 7 — Mettre le code sur GitHub

> Si tu as le projet en `.zip`, dézippe-le d'abord.

**Important — le nom du dépôt :** ce projet est configuré pour un dépôt nommé **`dahu-caisse`**.
Si tu choisis un autre nom, ouvre `next.config.mjs` et change la ligne `const repo = "dahu-caisse";` pour mettre le nom **exact** de ton dépôt.

**En ligne de commande :**
```bash
cd dahu-caisse
git init
git add .
git commit -m "Dahu Caisse - version GitHub Pages"
```
Crée un dépôt **public** vide sur https://github.com/new (nom : `dahu-caisse`, **sans** README/.gitignore).
> ℹ️ GitHub Pages gratuit nécessite un dépôt **public**. Aucun secret sensible n'est dans le code (la clé `anon` est faite pour être publique, c'est la RLS qui protège les données).
```bash
git remote add origin https://github.com/TON-PSEUDO/dahu-caisse.git
git branch -M main
git push -u origin main
```

**Sans ligne de commande :** utilise **GitHub Desktop** (https://desktop.github.com) → *Add Local Repository* → *Publish* (décoche « Keep this code private »).

### Étape 8 — Configurer GitHub Pages + les clés

1. Sur GitHub, va dans ton dépôt → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Crée **2 secrets** (valeurs de l'étape 4) :

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | ton Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ta clé anon public |

2. **Settings** → **Pages** → **Build and deployment** → **Source** : choisis **GitHub Actions**.
3. Va dans l'onglet **Actions** : le déploiement « Deploy to GitHub Pages » se lance (ou clique **Run workflow**). Attends qu'il passe au vert (~2 min).
4. Ton site est en ligne :
   **`https://TON-PSEUDO.github.io/dahu-caisse/`**

> 🔁 À chaque fois que tu fais `git push`, le site se reconstruit et se redéploie tout seul.

### Étape 9 — Dernier réglage + première connexion

1. Retourne dans Supabase → **Authentication → URL Configuration** et mets bien ton URL GitHub Pages dans **Site URL** (et dans **Redirect URLs** si proposé).
2. Ouvre ton site → **Connexion** → entre ton email + mot de passe admin.
3. **Produits** : crée ta carte. **Utilisateurs** : ajoute tes barmen (email + mot de passe ; transmets-leur).

---

## 🍺 Mettre tes vrais logos

Remplace, dans `public/images/`, le fichier **`logo-dahu-white.png`** par ton vrai logo (même nom).
Idem pour les icônes de l'app installable dans `public/icons/` (`icon-192.png`, `icon-512.png`).
Puis `git add . && git commit -m "logos" && git push` : le site se met à jour seul.

---

## 📱 Installer l'app sur un téléphone (PWA)

- **Android (Chrome)** : ouvre l'URL → menu ⋮ → **Ajouter à l'écran d'accueil**.
- **iPhone (Safari)** : **Partager** → **Sur l'écran d'accueil**.

---

## 🧑‍💻 Tester en local (facultatif)

```bash
npm install
cp .env.example .env.local     # remplis NEXT_PUBLIC_SUPABASE_URL et _ANON_KEY
npm run dev
```
Ouvre http://localhost:3000
> En local, le sous-dossier `/dahu-caisse` n'est pas appliqué (uniquement en production), donc tout marche sur `localhost:3000` directement.

---

## 👥 Les rôles

| Rôle | Connexion | Accès |
|------|-----------|-------|
| **Barman** | email + mot de passe | Caisse + carte |
| **Admin** | email + mot de passe | Tout le back-office |

Le barman ne voit **jamais** prix d'achat, marges, fournisseurs ni stats : c'est verrouillé en base (RLS), pas seulement masqué à l'écran.

---

## 💸 Encaissement

L'app **ne gère pas le paiement**. Le barman compose la commande et clique **Valider** : la vente est enregistrée et le stock décrémenté. **Le paiement est encaissé à part sur ton TPE.**

---

## 🗂️ Structure du projet

```
app/            Pages (caisse, admin, menu public, login)
components/     Composants réutilisables (UI, caisse, admin, RouteGuard)
hooks/          Logique React (panier, produits, auth)
services/       Accès aux données Supabase (produits, ventes, stock, stats)
lib/            Client Supabase navigateur + utilitaires
types/          Types TypeScript
database/       Les 4 fichiers SQL à exécuter dans Supabase
public/         Images, icônes, manifest PWA, .nojekyll
.github/        Workflow de déploiement automatique GitHub Pages
```

---

## ❓ Problèmes fréquents

- **Page blanche / 404 sur GitHub Pages** : vérifie que `const repo` dans `next.config.mjs` = nom **exact** du dépôt, et que **Pages → Source = GitHub Actions**.
- **« Invalid login credentials »** : compte non confirmé. Dans Supabase, soit tu désactives *Confirm email*, soit tu coches *Auto Confirm* en créant l'utilisateur. Vérifie aussi qu'une ligne existe dans `profiles`.
- **Un compte créé depuis l'app ne peut pas se connecter** : si *Confirm email* est activé, l'utilisateur doit cliquer le lien reçu par email. Pour des barmen sans email réel, désactive *Confirm email* (étape 5.2).
- **Les photos ne s'affichent pas** : le bucket `photos` doit exister et être **public**.
- **« relation … does not exist »** : un fichier SQL n'a pas été exécuté dans l'ordre. Reprends à `schema.sql`.
- **Le workflow Actions échoue** : vérifie que les **2 secrets** sont bien créés (orthographe exacte).

---

Fait avec 💜 pour **Dahu Sound System** — *One Love, One Sound, One Vibe.*
