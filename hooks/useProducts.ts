// ============================================================
// Hook produits — chargement + Realtime (stock live entre barmen)
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchActiveProducts } from "@/services/products.service";
import type { ProductWithVariants } from "@/types/database";

export function useProducts() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchActiveProducts();
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Realtime : recharge quand le stock change (autre barman, réappro admin)
    const supabase = createClient();
    const channel = supabase
      .channel("variants-stock")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_variants" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { products, loading, error, reload: load };
}
