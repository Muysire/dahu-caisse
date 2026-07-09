-- ============================================================
--  DAHU CAISSE — Base de données Supabase
--  À coller dans Supabase > SQL Editor > New query > Run
--  (une seule fois, d'un bloc)
-- ============================================================

-- ---------- Types ----------
do $$ begin
  create type user_role as enum ('admin','barman');
exception when duplicate_object then null; end $$;

do $$ begin
  create type movement_type as enum ('sale','restock','inventory','correction','initial','import');
exception when duplicate_object then null; end $$;

-- ---------- Tables ----------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  role        user_role not null default 'barman',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  icon          text,
  display_order int not null default 0
);

create table if not exists suppliers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  contact    text, phone text, email text, notes text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category_id   uuid references categories(id) on delete set null,
  description   text,
  active        boolean not null default true,
  visible       boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  label          text not null,
  code           text,
  photo_url      text,
  purchase_price numeric(10,2) not null default 0,
  sale_price     numeric(10,2) not null default 0,
  stock          int not null default 0,
  min_stock      int not null default 0,
  unit           text default 'unité',
  volume_cl      numeric(6,1),
  display_order  int not null default 0,
  is_default     boolean not null default false
);

create table if not exists sales (
  id         uuid primary key default gen_random_uuid(),
  total      numeric(10,2) not null default 0,
  item_count int not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references sales(id) on delete cascade,
  variant_id   uuid references product_variants(id) on delete set null,
  product_name text not null,
  qty          int not null,
  unit_price   numeric(10,2) not null,
  line_total   numeric(10,2) not null,
  created_at   timestamptz not null default now()
);

create table if not exists stock_movements (
  id          uuid primary key default gen_random_uuid(),
  variant_id  uuid references product_variants(id) on delete set null,
  type        movement_type not null,
  qty_delta   int not null,
  stock_after int not null,
  reason      text,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists purchases (
  id                  uuid primary key default gen_random_uuid(),
  supplier_id         uuid references suppliers(id) on delete set null,
  variant_id          uuid references product_variants(id) on delete set null,
  qty                 int not null,
  unit_purchase_price numeric(10,2) not null,
  total_cost          numeric(10,2) not null,
  supplier_ref        text,
  purchase_date       date not null default current_date,
  created_at          timestamptz not null default now()
);

-- ============================================================
--  FONCTIONS
-- ============================================================

-- Création automatique du profil à l'inscription (comptes créés depuis l'app)
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_username text; v_role user_role;
begin
  v_username := coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1));
  begin v_role := coalesce((new.raw_user_meta_data->>'role')::user_role,'barman');
  exception when others then v_role := 'barman'; end;
  insert into profiles (id, username, role, active) values (new.id, v_username, v_role, true)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Vente atomique : décrémente le stock et journalise (anti-désync multi-barmen)
create or replace function create_sale(items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_sale_id uuid; v_total numeric(10,2) := 0; v_count int := 0;
  it jsonb; v_variant product_variants%rowtype; v_qty int; v_pname text;
begin
  insert into sales (total, item_count, created_by) values (0,0,auth.uid()) returning id into v_sale_id;
  for it in select * from jsonb_array_elements(items) loop
    v_qty := (it->>'qty')::int;
    select * into v_variant from product_variants where id = (it->>'variant_id')::uuid for update;
    if not found then raise exception 'Variante introuvable'; end if;
    if v_variant.stock < v_qty then raise exception 'Stock insuffisant'; end if;
    select p.name || ' — ' || v_variant.label into v_pname from products p where p.id = v_variant.product_id;
    update product_variants set stock = stock - v_qty where id = v_variant.id;
    insert into sale_items (sale_id, variant_id, product_name, qty, unit_price, line_total)
      values (v_sale_id, v_variant.id, v_pname, v_qty, v_variant.sale_price, v_variant.sale_price * v_qty);
    insert into stock_movements (variant_id, type, qty_delta, stock_after, reason, created_by)
      values (v_variant.id, 'sale', -v_qty, v_variant.stock - v_qty, 'Vente caisse', auth.uid());
    v_total := v_total + v_variant.sale_price * v_qty; v_count := v_count + v_qty;
  end loop;
  update sales set total = v_total, item_count = v_count where id = v_sale_id;
  return jsonb_build_object('sale_id', v_sale_id, 'total', v_total, 'item_count', v_count);
end $$;

-- Ajustement de stock (réappro / correction / inventaire)
create or replace function adjust_stock(p_variant_id uuid, p_value int, p_mode text, p_type movement_type, p_reason text)
returns int language plpgsql security definer set search_path = public as $$
declare v_old int; v_new int;
begin
  select stock into v_old from product_variants where id = p_variant_id for update;
  if not found then raise exception 'Variante introuvable'; end if;
  v_new := case when p_mode = 'add' then v_old + p_value else p_value end;
  if v_new < 0 then raise exception 'Le stock ne peut pas être négatif'; end if;
  update product_variants set stock = v_new where id = p_variant_id;
  insert into stock_movements (variant_id, type, qty_delta, stock_after, reason, created_by)
    values (p_variant_id, p_type, v_new - v_old, v_new, p_reason, auth.uid());
  return v_new;
end $$;

-- Enregistrement d'un achat (+ réappro auto)
create or replace function record_purchase(p_supplier_id uuid, p_variant_id uuid, p_qty int, p_unit_price numeric, p_supplier_ref text, p_date date)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into purchases (supplier_id, variant_id, qty, unit_purchase_price, total_cost, supplier_ref, purchase_date)
    values (p_supplier_id, p_variant_id, p_qty, p_unit_price, p_qty * p_unit_price, p_supplier_ref, p_date);
  perform adjust_stock(p_variant_id, p_qty, 'add', 'restock', 'Achat fournisseur');
end $$;

-- Helper : l'utilisateur courant est-il admin ?
create or replace function is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and active);
$$;


-- ============================================================
--  GESTION DES COMPTES (admin)
-- ============================================================

-- Supprimer DÉFINITIVEMENT un utilisateur (profil + compte de connexion).
-- Sécurité : seul un admin peut appeler cette fonction, et personne
-- ne peut supprimer son propre compte.
create or replace function delete_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if p_user_id = auth.uid() then raise exception 'Impossible de supprimer son propre compte'; end if;
  delete from auth.users where id = p_user_id;   -- le profil suit (ON DELETE CASCADE)
end $$;

-- Changer le mot de passe d'un AUTRE utilisateur (admin uniquement).
-- Nécessite l'extension pgcrypto, activée juste en dessous.
create extension if not exists pgcrypto with schema extensions;

create or replace function admin_set_password(p_user_id uuid, p_new_password text)
returns void language plpgsql security definer set search_path = public, auth, extensions as $$
begin
  if not is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if length(p_new_password) < 6 then raise exception 'Mot de passe trop court (6 caractères minimum)'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_user_id;
  if not found then raise exception 'Utilisateur introuvable'; end if;
end $$;

-- Ces deux fonctions ne sont appelables que par un utilisateur connecté
revoke all on function delete_user(uuid) from public, anon;
revoke all on function admin_set_password(uuid, text) from public, anon;
grant execute on function delete_user(uuid) to authenticated;
grant execute on function admin_set_password(uuid, text) to authenticated;

-- ============================================================
--  SÉCURITÉ (RLS) — qui voit / fait quoi
-- ============================================================
alter table profiles enable row level security;
alter table categories enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table stock_movements enable row level security;
alter table purchases enable row level security;

-- Menu public : lecture des produits/variantes/catégories par tout le monde (même non connecté)
drop policy if exists "cat_read" on categories;
create policy "cat_read" on categories for select using (true);
drop policy if exists "prod_read" on products;
create policy "prod_read" on products for select using (true);
drop policy if exists "variant_read" on product_variants;
create policy "variant_read" on product_variants for select using (true);

-- Admin gère le catalogue
drop policy if exists "cat_admin" on categories;
create policy "cat_admin" on categories for all using (is_admin()) with check (is_admin());
drop policy if exists "prod_admin" on products;
create policy "prod_admin" on products for all using (is_admin()) with check (is_admin());
drop policy if exists "variant_admin" on product_variants;
create policy "variant_admin" on product_variants for all using (is_admin()) with check (is_admin());

-- Fournisseurs & achats : admin uniquement (le barman ne voit jamais ça)
drop policy if exists "sup_admin" on suppliers;
create policy "sup_admin" on suppliers for all using (is_admin()) with check (is_admin());
drop policy if exists "pur_admin" on purchases;
create policy "pur_admin" on purchases for all using (is_admin()) with check (is_admin());

-- Ventes : tout utilisateur connecté peut lire et créer ; modif/suppr admin
drop policy if exists "sales_read" on sales;
create policy "sales_read" on sales for select using (auth.uid() is not null);
drop policy if exists "sales_insert" on sales;
create policy "sales_insert" on sales for insert with check (auth.uid() is not null);
drop policy if exists "items_read" on sale_items;
create policy "items_read" on sale_items for select using (auth.uid() is not null);
drop policy if exists "items_insert" on sale_items;
create policy "items_insert" on sale_items for insert with check (auth.uid() is not null);

-- Mouvements de stock : lecture connecté, écriture via fonctions (security definer)
drop policy if exists "mv_read" on stock_movements;
create policy "mv_read" on stock_movements for select using (auth.uid() is not null);
drop policy if exists "mv_insert" on stock_movements;
create policy "mv_insert" on stock_movements for insert with check (auth.uid() is not null);

-- Profils : chacun lit le sien, l'admin lit/gère tout
drop policy if exists "prof_read" on profiles;
create policy "prof_read" on profiles for select using (id = auth.uid() or is_admin());
drop policy if exists "prof_admin" on profiles;
create policy "prof_admin" on profiles for all using (is_admin()) with check (is_admin());

-- ============================================================
--  DONNÉES DE DÉPART (catégories + quelques produits)
--  Tu pourras tout modifier ensuite depuis l'app.
-- ============================================================
insert into categories (name, slug, icon, display_order) values
  ('Bières','bieres','🍺',1),('Softs','softs','🥤',2),('Alcools','alcools','🥃',3),('Snacks','snacks','🍿',4)
on conflict (slug) do nothing;

-- Exemple : une bière blonde avec 2 formats
do $$
declare c_bieres uuid; p uuid;
begin
  select id into c_bieres from categories where slug='bieres';
  insert into products (name, category_id, description) values ('Bière Blonde', c_bieres, 'Pression maison') returning id into p;
  insert into product_variants (product_id, label, code, purchase_price, sale_price, stock, min_stock, unit, volume_cl, display_order, is_default)
  values (p,'25 cl','BIE-25',0.6,2.5,200,40,'verre',25,0,false),
         (p,'50 cl','BIE-50',1.1,4.5,100,20,'verre',50,1,false);
end $$;

-- ✅ Terminé. Passe à l'étape suivante du guide : créer ton compte admin.
