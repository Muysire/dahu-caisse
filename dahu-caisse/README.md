# 🏔️ Dahu Caisse

Application de **caisse et gestion de stock** pour les événements de **Dahu Sound System**.
Conçue pour le rush : interface tactile, ventes atomiques multi-barmen, gestion de stock en temps réel, statistiques et exports comptables.

- **Caisse** : prise de commande rapide, panier, validation (paiement encaissé à part sur le TPE).
- **Stock** : réapprovisionnement, inventaire, corrections, alertes de seuil.
- **Admin** : produits & variantes, fournisseurs, achats, prévisions, historique, stats, exports CSV, utilisateurs.
- **Menu public** : la carte consultable sans connexion (sans achat en ligne).

Stack : **Next.js 15 · TypeScript · Tailwind · Supabase · Vercel**.
Hébergement **100 % gratuit** (offres gratuites Supabase + Vercel).

---

## 🎯 Vue d'ensemble : comment ça marche

```
  [Téléphone / Tablette / PC]
            │
            ▼
   Application Next.js  ───►  hébergée gratuitement sur VERCEL
            │
            ▼
   Base de données + Auth + Photos  ───►  SUPABASE (gratuit)
```

Tu n'as **rien à payer** tant que tu restes dans les limites des offres gratuites (très larges pour un usage associatif).

---

## ✅ Ce qu'il te faut (gratuit)

1. Un compte **GitHub** → https://github.com
2. Un compte **Supabase** → https://supabase.com
3. Un compte **Vercel** → https://vercel.com
4. **Node.js** installé sur ton ordi (pour tester en local, optionnel) → https://nodejs.org (version 18.18 ou plus)

---

## 🚀 Installation pas à pas

> Suis les étapes **dans l'ordre**. Compte ~30 minutes la première fois.

### Étape 1 — Créer le projet Supabase

1. Va sur https://supabase.com → **Start your project** → connecte-toi.
2. **New project**.
   - **Name** : `dahu-caisse`
   - **Database Password** : choisis un mot de passe **fort** et **note-le** (tu n'en auras pas besoin au quotidien, mais garde-le).
   - **Region** : choisis **Europe (eu-west / Paris / Frankfurt)** (le plus proche).
   - **Plan** : **Free**.
3. Clique **Create new project** et attends ~2 minutes que la base se crée.

### Étape 2 — Créer les tables (SQL)

Dans ton projet Supabase, va dans **SQL Editor** (icône `</>` à gauche).
Tu vas exécuter **4 fichiers, dans cet ordre précis**. Pour chacun :
**New query** → copie-colle le contenu du fichier → **Run** (ou Ctrl/Cmd + Entrée).

| Ordre | Fichier (dossier `database/`) | Rôle |
|------|-------------------------------|------|
| 1 | `schema.sql` | Crée toutes les tables |
| 2 | `functions.sql` | Crée les fonctions (vente atomique, stock…) |
| 3 | `rls.sql` | Active la sécurité (qui peut voir/faire quoi) |
| 4 | `seed.sql` | (Optionnel) Ajoute des produits de démo |

> ⚠️ Respecte l'ordre. Si une requête renvoie une erreur, lis le message : le plus souvent c'est qu'un fichier précédent n'a pas été exécuté.

### Étape 3 — Créer le bucket de photos

1. Menu **Storage** → **New bucket**.
2. **Name** : `photos` (exactement ce nom, en minuscules).
3. Coche **Public bucket** (les photos produits doivent être visibles).
4. **Create bucket**.

### Étape 4 — Récupérer tes clés Supabase

1. Menu **Project Settings** (roue dentée) → **API**.
2. Note ces 3 valeurs (tu les colleras plus tard) :
   - **Project URL** → ex. `https://abcd1234.supabase.co`
   - **anon public** (clé publique)
   - **service_role** (clé secrète — **ne la partage JAMAIS**, ne la mets jamais dans le code public)

### Étape 5 — Créer ton premier compte ADMIN

L'app a besoin d'un admin pour démarrer. On le crée en 2 temps.

**5.1 — Créer le compte de connexion (Auth)**
1. Menu **Authentication** → **Users** → **Add user** → **Create new user**.
2. **Email** : ton email (ex. `theo@dahu.fr`).
3. **Password** : choisis un mot de passe (c'est celui que tu utiliseras pour te connecter en admin).
4. Coche **Auto Confirm User** (important, sinon le compte n'est pas activé).
5. **Create user**.
6. Clique sur l'utilisateur créé et **copie son `User UID`** (un identifiant du type `a1b2c3d4-...`).

**5.2 — Lui donner le rôle admin (SQL)**
Va dans **SQL Editor** → **New query**, colle ceci en remplaçant les deux valeurs, puis **Run** :

```sql
insert into profiles (id, username, role, active)
values ('COLLE-ICI-LE-USER-UID', 'theo', 'admin', true);
```

> `username` = le nom affiché dans l'app (mets ce que tu veux).
> Tu peux ensuite créer tous les autres comptes (admins et barmen) **directement depuis l'app**, page **Admin → Utilisateurs**. Plus besoin de SQL.

### Étape 6 — Mettre le code sur GitHub

> Si tu as reçu le projet en `.zip`, dézippe-le d'abord dans un dossier.

**Option A — En ligne de commande (recommandé) :**
```bash
cd dahu-caisse           # va dans le dossier du projet
git init
git add .
git commit -m "Dahu Caisse - version initiale"
```
Crée ensuite un dépôt vide sur https://github.com/new (nom : `dahu-caisse`, **Private** de préférence), **sans** README ni .gitignore. Puis :
```bash
git remote add origin https://github.com/TON-PSEUDO/dahu-caisse.git
git branch -M main
git push -u origin main
```

**Option B — Sans ligne de commande :**
Sur https://github.com/new crée le dépôt, puis utilise **GitHub Desktop** (https://desktop.github.com) : *Add Local Repository* → sélectionne le dossier → *Publish*.

> Le fichier `.gitignore` est déjà configuré : tes secrets (`.env.local`) et `node_modules` **ne seront jamais envoyés** sur GitHub. ✅

### Étape 7 — Déployer sur Vercel

1. Va sur https://vercel.com → **Sign up** → **Continue with GitHub**.
2. **Add New… → Project**.
3. **Import** ton dépôt `dahu-caisse`.
4. Vercel détecte Next.js automatiquement — **ne touche à rien** dans les réglages de build.
5. Déplie **Environment Variables** et ajoute les **3 variables** (valeurs de l'étape 4) :

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | ton Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ta clé anon public |
   | `SUPABASE_SERVICE_ROLE_KEY` | ta clé service_role (secrète) |

6. Clique **Deploy** et attends ~2 minutes.
7. 🎉 Vercel te donne une URL du type `https://dahu-caisse.vercel.app`.

### Étape 8 — Première connexion

1. Ouvre ton URL Vercel.
2. Clique **Connexion** → onglet **Admin** → entre ton email + mot de passe (étape 5).
3. Tu arrives sur le **Dashboard**. Va dans **Produits** pour créer ta carte, puis **Utilisateurs** pour ajouter tes barmen (chacun avec un **code PIN à 4 chiffres**).

---

## 🍺 Mettre tes vrais logos

Place tes fichiers dans `public/images/` en gardant **exactement ces noms** :

- `logo-dahu-white.png` (utilisé un peu partout dans l'app)

> Un logo provisoire est déjà fourni. Remplace-le par le vrai, puis refais un `git add . && git commit -m "logos" && git push` : Vercel redéploie tout seul.

Les icônes de l'app installable (PWA) sont dans `public/icons/` (`icon-192.png`, `icon-512.png`) — remplace-les aussi par ton logo si tu veux une belle icône sur l'écran d'accueil du téléphone.

---

## 📱 Installer l'app sur un téléphone / tablette (PWA)

L'app s'installe comme une vraie application, sans passer par un store :

- **Android (Chrome)** : ouvre l'URL → menu ⋮ → **Ajouter à l'écran d'accueil**.
- **iPhone/iPad (Safari)** : ouvre l'URL → bouton **Partager** → **Sur l'écran d'accueil**.

Elle se lance alors en plein écran, parfaite pour le bar.

---

## 🧑‍💻 Tester en local (optionnel)

```bash
npm install
cp .env.example .env.local      # puis remplis tes 3 clés Supabase dans .env.local
npm run dev
```
Ouvre http://localhost:3000

---

## 👥 Les rôles

| Rôle | Connexion | Peut faire |
|------|-----------|------------|
| **Barman** | Code **PIN** à 4 chiffres | Encaisser à la caisse, voir la carte |
| **Admin** | **Email + mot de passe** | Tout : produits, stock, achats, fournisseurs, prévisions, stats, exports, utilisateurs |

> Le barman ne voit **jamais** les prix d'achat, les marges, les fournisseurs ni les stats. C'est verrouillé au niveau de la base de données (RLS), pas seulement masqué à l'écran.

---

## 💸 Encaissement

L'application **ne gère pas le paiement**. Le barman compose la commande et clique **Valider** : la vente est enregistrée et le stock décrémenté. **Le paiement est encaissé séparément sur ton TPE.**

---

## 🗂️ Structure du projet (pour info)

```
app/            Pages (caisse, admin, menu public, API)
components/     Composants réutilisables (UI, caisse, admin)
hooks/          Logique React (panier, produits, auth)
services/       Accès aux données (produits, ventes, stock, stats)
lib/            Clients Supabase + utilitaires
types/          Types TypeScript
database/       Les 4 fichiers SQL à exécuter dans Supabase
public/         Images, icônes, manifest PWA
```

---

## ❓ Problèmes fréquents

- **« Invalid login credentials » en admin** : le compte n'est pas confirmé. Va dans Supabase → Authentication → coche *Auto Confirm* (ou recrée l'utilisateur en cochant la case), et vérifie qu'une ligne existe bien dans `profiles` avec `role = 'admin'`.
- **Le barman ne peut pas se connecter avec son PIN** : recrée-le depuis Admin → Utilisateurs. Le PIN n'est pas récupérable une fois créé.
- **Les photos ne s'affichent pas** : vérifie que le bucket `photos` existe et qu'il est **public**.
- **« relation … does not exist »** lors du SQL : un fichier n'a pas été exécuté dans l'ordre. Reprends à `schema.sql`.
- **Build qui échoue sur Vercel** : vérifie que les **3 variables d'environnement** sont bien renseignées.

---

Fait avec 💜 pour **Dahu Sound System** — *One Love, One Sound, One Vibe.*
