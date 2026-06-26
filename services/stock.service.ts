// ============================================================
// Service Stock — réappro, inventaire, corrections (admin)
// ============================================================
import { createClient } from "@/lib/supabase/client";
import type { MovementType } from "@/types/database";

/**
 * Ajuste le stock d'une variante.
 * mode "add" => réapprovisionnement (ajoute la quantité)
 * mode "set" => inventaire / correction (fixe la valeur absolue)
 */
export async function adjustStock(params: {
  variantId: string;
  value: number;
  mode: "add" | "set";
  type: MovementType;
  reason?: string;
}): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("adjust_stock", {
    p_variant_id: params.variantId,
    p_value: params.value,
    p_mode: params.mode,
    p_type: params.type,
    p_reason: params.reason ?? null,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

/** Enregistre un achat fournisseur (réapprovisionne automatiquement). */
export async function recordPurchase(params: {
  supplierId: string | null;
  variantId: string;
  qty: number;
  unitPrice: number;
  supplierRef?: string;
  date?: string;
}): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("record_purchase", {
    p_supplier_id: params.supplierId,
    p_variant_id: params.variantId,
    p_qty: params.qty,
    p_unit_price: params.unitPrice,
    p_supplier_ref: params.supplierRef ?? null,
    p_date: params.date ?? new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
  return data as string;
}
