// ============================================================
// DAHU CAISSE — Types de la base de données
// Reflète le schéma SQL (database/schema.sql).
// ============================================================

export type UserRole = "admin" | "barman";

export type MovementType =
  | "sale"
  | "restock"
  | "inventory"
  | "correction"
  | "initial";

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  active: boolean;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string;
  code: string | null;
  photo_url: string | null;
  purchase_price: number; // admin only — jamais envoyé au barman/public
  sale_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  volume_cl: number | null;
  display_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  total: number;
  item_count: number;
  created_by: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  variant_id: string | null;
  product_name: string;
  qty: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface StockMovement {
  id: string;
  variant_id: string | null;
  type: MovementType;
  qty_delta: number;
  stock_after: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Purchase {
  id: string;
  supplier_id: string | null;
  variant_id: string | null;
  qty: number;
  unit_purchase_price: number;
  total_cost: number;
  supplier_ref: string | null;
  purchase_date: string;
  created_by: string | null;
  created_at: string;
}

export interface EventForecast {
  id: string;
  name: string;
  nb_people: number;
  nb_days: number;
  liters_beer_pp: number;
  liters_soft_pp: number;
  liters_alcohol_pp: number;
  created_at: string;
}

// ── Types composés (vues métier) ──────────────────────────

/** Produit avec ses variantes et sa catégorie (utilisé en caisse/admin). */
export interface ProductWithVariants extends Product {
  category: Category | null;
  variants: ProductVariant[];
}

/** Variante "publique" — SANS prix d'achat (menu client + barman). */
export type PublicVariant = Omit<ProductVariant, "purchase_price">;

/** Statut de stock pour le code couleur. */
export type StockStatus = "ok" | "low" | "out";

/** Ligne du panier en caisse. */
export interface CartLine {
  variantId: string;
  productName: string; // "Coca-Cola — 33 cl"
  label: string;
  salePrice: number;
  qty: number;
  stock: number; // stock dispo (pour bloquer la sur-vente)
  photoUrl: string | null;
}
