// ============================================================
// Service Ventes — appelle la RPC atomique create_sale
// ============================================================
import { createClient } from "@/lib/supabase/client";
import type { CartLine } from "@/types/database";

export interface SaleResult {
  sale_id: string;
  total: number;
  item_count: number;
}

/**
 * Enregistre une vente de façon ATOMIQUE via la fonction PostgreSQL.
 * Le stock est décrémenté et journalisé côté serveur en une transaction.
 */
export async function submitSale(lines: CartLine[]): Promise<SaleResult> {
  const supabase = createClient();

  const items = lines.map((l) => ({ variant_id: l.variantId, qty: l.qty }));

  const { data, error } = await supabase.rpc("create_sale", { items });

  if (error) throw new Error(error.message);
  // La RPC renvoie un tableau d'une ligne
  const row = Array.isArray(data) ? data[0] : data;
  return row as SaleResult;
}
