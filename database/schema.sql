-- ============================================================
-- DAHU CAISSE — SCHÉMA DE BASE DE DONNÉES
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- Ordre d'exécution : 1) schema.sql  2) functions.sql  3) rls.sql  4) seed.sql
-- ============================================================

-- Extension pour générer des UUID
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- TYPES ÉNUMÉRÉS
-- ------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'barman');
exception when duplicate_object then null; end $$;

do $$ begin
  create type movement_type as enum ('sale', 'restock', 'inventory', 'correction', 'initial');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- PROFILES — utilisateurs de l'app (liés à auth.users de Supabase)
-- Admins ET barmen se connectent par email + mot de passe.
-- Le profil est créé automatiquement à l'inscription (trigger
-- handle_new_user, voir functions.sql) à partir des métadonnées.
-- ------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  role        user_role not null default 'barman',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SUPPLIERS — fournisseurs (visibles admin uniquement)
-- ------------------------------------------------------------
create table if not exists suppliers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact     text,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CATEGORIES — bières / softs / alcools / snacks / autres
-- ------------------------------------------------------------
create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  icon          text,                     -- emoji affiché en caisse
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PRODUCTS — produit parent (le stock/prix vivent dans les variantes)
-- ------------------------------------------------------------
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category_id   uuid references categories(id) on delete set null,
  description   text,
  active        boolean not null default true,   -- utilisable en caisse
  visible       boolean not null default true,   -- visible sur le menu public
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PRODUCT_VARIANTS — déclinaisons (33cl, 50cl, canette...)
-- C'EST ICI que vivent stock, prix d'achat, prix de vente.
-- Un produit "simple" possède exactement 1 variante (label "Standard").
-- ------------------------------------------------------------
create table if not exists product_variants (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  label           text not null default 'Standard',  -- "33 cl", "Canette"...
  code            text unique,                        -- code-barre / référence interne
  photo_url       text,
  purchase_price  numeric(10,2) not null default 0,   -- prix d'achat (admin only)
  sale_price      numeric(10,2) not null default 0,   -- prix de vente
  stock           int not null default 0,
  min_stock       int not null default 0,             -- seuil d'alerte
  unit            text not null default 'unité',       -- unité, cl, L...
  volume_cl       numeric(10,2),                       -- contenance en cl (pour prévisions)
  display_order   int not null default 0,
  is_default      boolean not null default false,      -- variante par défaut d'un produit simple
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_variants_product on product_variants(product_id);

-- ------------------------------------------------------------
-- SALES — tickets de vente
-- ------------------------------------------------------------
create table if not exists sales (
  id          uuid primary key default gen_random_uuid(),
  total       numeric(10,2) not null default 0,
  item_count  int not null default 0,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_sales_created_at on sales(created_at);

-- ------------------------------------------------------------
-- SALE_ITEMS — lignes de vente (snapshot prix + nom = historique fiable)
-- ------------------------------------------------------------
create table if not exists sale_items (
  id            uuid primary key default gen_random_uuid(),
  sale_id       uuid not null references sales(id) on delete cascade,
  variant_id    uuid references product_variants(id) on delete set null,
  product_name  text not null,            -- snapshot ("Coca-Cola — 33 cl")
  qty           int not null,
  unit_price    numeric(10,2) not null,   -- snapshot du prix au moment de la vente
  line_total    numeric(10,2) not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_sale_items_variant on sale_items(variant_id);

-- ------------------------------------------------------------
-- STOCK_MOVEMENTS — journal de TOUS les mouvements de stock
-- ------------------------------------------------------------
create table if not exists stock_movements (
  id           uuid primary key default gen_random_uuid(),
  variant_id   uuid references product_variants(id) on delete set null,
  type         movement_type not null,
  qty_delta    int not null,             -- négatif (vente) ou positif (réappro)
  stock_after  int not null,             -- stock résultant (traçabilité)
  reason       text,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_movements_variant on stock_movements(variant_id);
create index if not exists idx_movements_created_at on stock_movements(created_at);

-- ------------------------------------------------------------
-- PURCHASES — achats fournisseurs (admin only)
-- ------------------------------------------------------------
create table if not exists purchases (
  id                   uuid primary key default gen_random_uuid(),
  supplier_id          uuid references suppliers(id) on delete set null,
  variant_id           uuid references product_variants(id) on delete set null,
  qty                  int not null,
  unit_purchase_price  numeric(10,2) not null,
  total_cost           numeric(10,2) not null,
  supplier_ref         text,
  purchase_date        date not null default current_date,
  created_by           uuid references profiles(id) on delete set null,
  created_at           timestamptz not null default now()
);

create index if not exists idx_purchases_date on purchases(purchase_date);

-- ------------------------------------------------------------
-- EVENT_FORECASTS — paramètres de prévision de stock
-- ------------------------------------------------------------
create table if not exists event_forecasts (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  nb_people            int not null default 100,
  nb_days              int not null default 1,
  liters_beer_pp       numeric(10,2) not null default 1.5,   -- L de bière / personne / jour
  liters_soft_pp       numeric(10,2) not null default 0.5,
  liters_alcohol_pp    numeric(10,2) not null default 0.2,
  created_at           timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TRIGGER — maj automatique de updated_at
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_variants_updated on product_variants;
create trigger trg_variants_updated before update on product_variants
  for each row execute function set_updated_at();
