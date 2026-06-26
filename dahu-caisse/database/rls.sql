-- ============================================================
-- DAHU CAISSE — ROW LEVEL SECURITY (RLS)
-- À exécuter APRÈS functions.sql
--
-- Principe :
--  - PUBLIC (anon) : peut lire les produits/variantes VISIBLES (menu client),
--    mais JAMAIS les prix d'achat (filtrés au niveau service/UI).
--  - BARMAN : lit produits/variantes actifs, crée des ventes (via RPC).
--    Ne voit PAS : fournisseurs, achats, prix d'achat, stats détaillées.
--  - ADMIN : accès total.
-- ============================================================

-- Active RLS sur toutes les tables
alter table profiles          enable row level security;
alter table suppliers         enable row level security;
alter table categories        enable row level security;
alter table products          enable row level security;
alter table product_variants  enable row level security;
alter table sales             enable row level security;
alter table sale_items        enable row level security;
alter table stock_movements   enable row level security;
alter table purchases         enable row level security;
alter table event_forecasts   enable row level security;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
drop policy if exists "profiles_select_self_or_admin" on profiles;
create policy "profiles_select_self_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists "profiles_admin_all" on profiles;
create policy "profiles_admin_all" on profiles
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- CATEGORIES — lecture pour tous (menu public), écriture admin
-- ------------------------------------------------------------
drop policy if exists "categories_read_all" on categories;
create policy "categories_read_all" on categories
  for select using (true);

drop policy if exists "categories_admin_write" on categories;
create policy "categories_admin_write" on categories
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- PRODUCTS
--  - anon : seulement visibles
--  - connecté : tous (le barman a besoin des actifs)
--  - admin : écriture
-- ------------------------------------------------------------
drop policy if exists "products_read_public_visible" on products;
create policy "products_read_public_visible" on products
  for select using (
    visible = true            -- public : produits affichés sur le menu
    or auth.uid() is not null  -- connecté : tout est lisible
  );

drop policy if exists "products_admin_write" on products;
create policy "products_admin_write" on products
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- PRODUCT_VARIANTS — idem produits (le filtrage du prix d'achat
-- se fait dans la couche service : le barman ne SELECT jamais purchase_price)
-- ------------------------------------------------------------
drop policy if exists "variants_read" on product_variants;
create policy "variants_read" on product_variants
  for select using (
    auth.uid() is not null
    or exists (
      select 1 from products p
      where p.id = product_variants.product_id and p.visible = true
    )
  );

drop policy if exists "variants_admin_write" on product_variants;
create policy "variants_admin_write" on product_variants
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- SALES & SALE_ITEMS
--  - création : via RPC create_sale (security definer), donc pas besoin
--    de policy INSERT directe ; on autorise la lecture aux connectés.
--  - admin voit tout l'historique.
-- ------------------------------------------------------------
drop policy if exists "sales_read_connected" on sales;
create policy "sales_read_connected" on sales
  for select using (auth.uid() is not null);

drop policy if exists "sales_admin_all" on sales;
create policy "sales_admin_all" on sales
  for all using (is_admin()) with check (is_admin());

drop policy if exists "sale_items_read_connected" on sale_items;
create policy "sale_items_read_connected" on sale_items
  for select using (auth.uid() is not null);

drop policy if exists "sale_items_admin_all" on sale_items;
create policy "sale_items_admin_all" on sale_items
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- STOCK_MOVEMENTS — lecture admin uniquement (le barman n'en a pas besoin)
-- ------------------------------------------------------------
drop policy if exists "movements_admin" on stock_movements;
create policy "movements_admin" on stock_movements
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- SUPPLIERS / PURCHASES — ADMIN UNIQUEMENT (le barman ne voit rien)
-- ------------------------------------------------------------
drop policy if exists "suppliers_admin" on suppliers;
create policy "suppliers_admin" on suppliers
  for all using (is_admin()) with check (is_admin());

drop policy if exists "purchases_admin" on purchases;
create policy "purchases_admin" on purchases
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- EVENT_FORECASTS — admin uniquement
-- ------------------------------------------------------------
drop policy if exists "forecasts_admin" on event_forecasts;
create policy "forecasts_admin" on event_forecasts
  for all using (is_admin()) with check (is_admin());
