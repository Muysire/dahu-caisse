// ============================================================
// Service Produits — lecture/écriture produits & variantes
// ============================================================
import { createClient } from "@/lib/supabase/client";
import type { ProductWithVariants, ProductVariant } from "@/types/database";

/**
 * Charge tous les produits ACTIFS avec leurs variantes + catégorie.
 * Utilisé en caisse (barman) : on NE sélectionne PAS purchase_price.
 */
export async function fetchActiveProducts(): Promise<ProductWithVariants[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, name, category_id, description, active, visible, display_order, created_at, updated_at,
      category:categories ( id, name, slug, icon, display_order, created_at ),
      variants:product_variants (
        id, product_id, label, code, photo_url, sale_price, stock, min_stock,
        unit, volume_cl, display_order, is_default, created_at, updated_at
      )
    `
    )
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;

  // purchase_price absent => on complète à 0 pour satisfaire le type (jamais affiché).
  return (data ?? []).map((p) => ({
    ...p,
    variants: (p.variants ?? [])
      .map((v) => ({ ...v, purchase_price: 0 }))
      .sort((a, b) => a.display_order - b.display_order),
  })) as unknown as ProductWithVariants[];
}

/**
 * Charge TOUS les produits avec variantes complètes (prix d'achat inclus).
 * Réservé à l'admin (la RLS bloquerait un barman de toute façon).
 */
export async function fetchAllProductsAdmin(): Promise<ProductWithVariants[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories ( * ),
      variants:product_variants ( * )
    `
    )
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    variants: ((p.variants ?? []) as ProductVariant[]).sort(
      (a, b) => a.display_order - b.display_order
    ),
  })) as unknown as ProductWithVariants[];
}

/** Charge les produits VISIBLES pour le menu public (sans prix d'achat). */
export async function fetchPublicMenu(): Promise<ProductWithVariants[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, name, category_id, description, active, visible, display_order, created_at, updated_at,
      category:categories ( id, name, slug, icon, display_order, created_at ),
      variants:product_variants (
        id, product_id, label, code, photo_url, sale_price, stock, min_stock,
        unit, volume_cl, display_order, is_default, created_at, updated_at
      )
    `
    )
    .eq("visible", true)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    variants: (p.variants ?? [])
      .map((v) => ({ ...v, purchase_price: 0 }))
      .sort((a, b) => a.display_order - b.display_order),
  })) as unknown as ProductWithVariants[];
}
