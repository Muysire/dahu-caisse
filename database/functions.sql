-- ============================================================
-- DAHU CAISSE — FONCTIONS (RPC)
-- À exécuter APRÈS schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- is_admin() — helper pour les politiques RLS
-- Renvoie true si l'utilisateur courant est un admin actif.
-- ------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- ------------------------------------------------------------
-- create_sale(items) — VENTE ATOMIQUE
-- Tout se passe dans UNE transaction. Si une seule ligne échoue
-- (stock insuffisant, variante introuvable), TOUT est annulé.
-- => impossible de désynchroniser le stock, même à plusieurs barmen.
--
-- Paramètre `items` : tableau JSON
--   [{ "variant_id": "uuid", "qty": 3 }, ...]
-- Renvoie l'id de la vente créée + le total.
-- ------------------------------------------------------------
create or replace function create_sale(items jsonb)
returns table (sale_id uuid, total numeric, item_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id   uuid;
  v_total     numeric(10,2) := 0;
  v_count     int := 0;
  v_item      jsonb;
  v_variant   product_variants%rowtype;
  v_qty       int;
  v_line      numeric(10,2);
  v_new_stock int;
  v_uid       uuid := auth.uid();
begin
  -- 1) Créer la vente (vide pour l'instant)
  insert into sales (total, item_count, created_by)
  values (0, 0, v_uid)
  returning id into v_sale_id;

  -- 2) Parcourir chaque ligne du panier
  for v_item in select * from jsonb_array_elements(items)
  loop
    v_qty := (v_item->>'qty')::int;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Quantité invalide';
    end if;

    -- Verrouille la ligne de stock le temps de la transaction (anti-concurrence)
    select * into v_variant
    from product_variants
    where id = (v_item->>'variant_id')::uuid
    for update;

    if not found then
      raise exception 'Produit introuvable';
    end if;

    if v_variant.stock < v_qty then
      raise exception 'Stock insuffisant pour % (reste %)', v_variant.label, v_variant.stock;
    end if;

    -- Calcul de la ligne
    v_line      := v_variant.sale_price * v_qty;
    v_new_stock := v_variant.stock - v_qty;
    v_total     := v_total + v_line;
    v_count     := v_count + v_qty;

    -- Ligne de vente (snapshot prix + nom)
    insert into sale_items (sale_id, variant_id, product_name, qty, unit_price, line_total)
    values (
      v_sale_id,
      v_variant.id,
      (select p.name from products p where p.id = v_variant.product_id) || ' — ' || v_variant.label,
      v_qty,
      v_variant.sale_price,
      v_line
    );

    -- Décrément du stock
    update product_variants set stock = v_new_stock where id = v_variant.id;

    -- Journal du mouvement
    insert into stock_movements (variant_id, type, qty_delta, stock_after, reason, created_by)
    values (v_variant.id, 'sale', -v_qty, v_new_stock, 'Vente caisse', v_uid);
  end loop;

  -- 3) Mettre à jour les totaux de la vente
  update sales set total = v_total, item_count = v_count where id = v_sale_id;

  return query select v_sale_id, v_total, v_count;
end;
$$;

-- ------------------------------------------------------------
-- adjust_stock(variant, new_qty, type, reason) — réappro / inventaire / correction
-- Pose le stock à une valeur absolue OU ajoute un delta, et journalise.
-- mode 'set'  => new_value est le stock final (inventaire/correction)
-- mode 'add'  => new_value est ajouté au stock actuel (réapprovisionnement)
-- ------------------------------------------------------------
create or replace function adjust_stock(
  p_variant_id uuid,
  p_value      int,
  p_mode       text,             -- 'set' ou 'add'
  p_type       movement_type,    -- 'restock' / 'inventory' / 'correction' / 'initial'
  p_reason     text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current  int;
  v_new      int;
  v_delta    int;
begin
  if not is_admin() then
    raise exception 'Action réservée à l''administrateur';
  end if;

  select stock into v_current from product_variants where id = p_variant_id for update;
  if not found then
    raise exception 'Produit introuvable';
  end if;

  if p_mode = 'add' then
    v_new := v_current + p_value;
    v_delta := p_value;
  else -- 'set'
    v_new := p_value;
    v_delta := p_value - v_current;
  end if;

  if v_new < 0 then
    raise exception 'Le stock ne peut pas être négatif';
  end if;

  update product_variants set stock = v_new where id = p_variant_id;

  insert into stock_movements (variant_id, type, qty_delta, stock_after, reason, created_by)
  values (p_variant_id, p_type, v_delta, v_new, p_reason, auth.uid());

  return v_new;
end;
$$;

-- ------------------------------------------------------------
-- record_purchase(...) — enregistre un achat fournisseur ET réapprovisionne
-- ------------------------------------------------------------
create or replace function record_purchase(
  p_supplier_id  uuid,
  p_variant_id   uuid,
  p_qty          int,
  p_unit_price   numeric,
  p_supplier_ref text default null,
  p_date         date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_total       numeric(10,2);
begin
  if not is_admin() then
    raise exception 'Action réservée à l''administrateur';
  end if;

  v_total := p_unit_price * p_qty;

  insert into purchases (supplier_id, variant_id, qty, unit_purchase_price, total_cost, supplier_ref, purchase_date, created_by)
  values (p_supplier_id, p_variant_id, p_qty, p_unit_price, v_total, p_supplier_ref, p_date, auth.uid())
  returning id into v_purchase_id;

  -- Le réappro met à jour le stock + journalise
  perform adjust_stock(p_variant_id, p_qty, 'add', 'restock', 'Achat fournisseur');

  return v_purchase_id;
end;
$$;

-- ------------------------------------------------------------
-- handle_new_user() — crée automatiquement le profil à l'inscription
-- Déclenché après chaque création dans auth.users. Lit le username et
-- le role depuis les métadonnées (raw_user_meta_data) envoyées au signUp.
-- Permet de créer des comptes 100% côté client, sans clé service_role.
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_role     user_role;
begin
  v_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );

  -- Le rôle vient des métadonnées ; par défaut 'barman'.
  begin
    v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'barman');
  exception when others then
    v_role := 'barman';
  end;

  insert into profiles (id, username, role, active)
  values (new.id, v_username, v_role, true)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
