-- ============================================================
-- DAHU CAISSE — DONNÉES DE DÉMO (SEED)
-- À exécuter APRÈS rls.sql (optionnel, mais pratique pour tester).
--
-- NOTE : la création des UTILISATEURS (admin/barman) se fait via
-- l'interface (page /admin/utilisateurs) ou le script décrit dans le README,
-- car elle passe par l'authentification Supabase. Ce seed ne crée QUE
-- des données métier.
-- ============================================================

-- Catégories
insert into categories (name, slug, icon, display_order) values
  ('Bières',  'bieres',  '🍺', 1),
  ('Softs',   'softs',   '🥤', 2),
  ('Alcools', 'alcools', '🥃', 3),
  ('Snacks',  'snacks',  '🍿', 4),
  ('Autres',  'autres',  '✨', 5)
on conflict (slug) do nothing;

-- Fournisseur de démo
insert into suppliers (name, contact, phone, email, notes) values
  ('Grossiste Boissons 74', 'Jean Michel', '04 50 00 00 00', 'contact@gb74.fr', 'Livraison le mardi')
on conflict do nothing;

-- Produits + variantes de démo
do $$
declare
  cat_biere uuid;
  cat_soft  uuid;
  cat_alcool uuid;
  cat_snack uuid;
  p_biere   uuid;
  p_coca    uuid;
  p_rhum    uuid;
  p_chips   uuid;
begin
  select id into cat_biere  from categories where slug = 'bieres';
  select id into cat_soft   from categories where slug = 'softs';
  select id into cat_alcool from categories where slug = 'alcools';
  select id into cat_snack  from categories where slug = 'snacks';

  -- Bière pression (3 variantes de contenance)
  insert into products (name, category_id, description, display_order)
  values ('Bière Blonde', cat_biere, 'Pression maison', 1) returning id into p_biere;

  insert into product_variants (product_id, label, code, purchase_price, sale_price, stock, min_stock, unit, volume_cl, display_order) values
    (p_biere, '25 cl', 'BIE-25', 0.60, 2.50, 200, 40, 'verre', 25, 1),
    (p_biere, '33 cl', 'BIE-33', 0.80, 3.00, 150, 30, 'verre', 33, 2),
    (p_biere, '50 cl', 'BIE-50', 1.10, 4.50, 100, 20, 'verre', 50, 3);

  -- Coca-Cola (2 variantes)
  insert into products (name, category_id, description, display_order)
  values ('Coca-Cola', cat_soft, NULL, 2) returning id into p_coca;

  insert into product_variants (product_id, label, code, purchase_price, sale_price, stock, min_stock, unit, volume_cl, display_order) values
    (p_coca, 'Canette 33 cl',   'COCA-33', 0.45, 2.00, 120, 24, 'canette',   33, 1),
    (p_coca, 'Bouteille 50 cl', 'COCA-50', 0.70, 2.50, 60,  12, 'bouteille', 50, 2);

  -- Rhum (produit simple = 1 variante par défaut)
  insert into products (name, category_id, display_order)
  values ('Rhum Arrangé', cat_alcool, 3) returning id into p_rhum;

  insert into product_variants (product_id, label, code, purchase_price, sale_price, stock, min_stock, unit, volume_cl, display_order, is_default) values
    (p_rhum, 'Shot 4 cl', 'RHUM-04', 0.90, 4.00, 80, 15, 'shot', 4, 1, true);

  -- Chips (produit simple)
  insert into products (name, category_id, display_order)
  values ('Chips', cat_snack, 4) returning id into p_chips;

  insert into product_variants (product_id, label, code, purchase_price, sale_price, stock, min_stock, unit, display_order, is_default) values
    (p_chips, 'Sachet', 'CHIPS', 0.50, 1.50, 50, 10, 'sachet', 1, true);
end $$;

-- Prévision d'événement de démo
insert into event_forecasts (name, nb_people, nb_days, liters_beer_pp, liters_soft_pp, liters_alcohol_pp)
values ('Soirée Halloween 🎃', 200, 1, 1.5, 0.5, 0.2)
on conflict do nothing;
