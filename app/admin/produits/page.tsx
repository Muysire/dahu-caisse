// ============================================================
// ADMIN — Produits : liste + création / édition / activation
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllProductsAdmin } from "@/services/products.service";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StockBadge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { formatEuro, stockStatus } from "@/lib/utils";
import type { Category, ProductWithVariants } from "@/types/database";
import { Plus, Pencil, EyeOff, Eye } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductWithVariants | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [prods, { data: cats }] = await Promise.all([
      fetchAllProductsAdmin(),
      supabase.from("categories").select("*").order("display_order"),
    ]);
    setProducts(prods);
    setCategories((cats as Category[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (p: ProductWithVariants) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ active: !p.active })
      .eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(p.active ? "Produit désactivé" : "Produit réactivé");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Produits"
        subtitle="Catalogue & variantes"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} className="mr-1 inline" /> Nouveau produit
          </Button>
        }
      />

      {loading ? (
        <p className="text-text-muted">Chargement…</p>
      ) : products.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-text-muted">Aucun produit. Crée le premier.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.category?.icon ?? "✨"}</span>
                    <span className="font-display text-2xl tracking-wide text-text-main">
                      {p.name}
                    </span>
                    {!p.active && <Badge className="border-stock-out/40 bg-stock-out/10 text-stock-out">Inactif</Badge>}
                    {!p.visible && <Badge>Masqué menu</Badge>}
                  </div>

                  {/* Variantes */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {p.variants.map((v) => {
                      const status = stockStatus(v.stock, v.min_stock);
                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-lg bg-bg px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-text-main">
                              {v.label}
                            </div>
                            <div className="font-mono text-xs text-text-muted">
                              {formatEuro(v.sale_price)} · achat {formatEuro(v.purchase_price)}
                            </div>
                          </div>
                          <StockBadge status={status}>{v.stock}</StockBadge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                    <Pencil size={15} className="mr-1 inline" /> Éditer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                    {p.active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <ProductForm
          product={null}
          categories={categories}
          onClose={() => setCreating(false)}
          onSaved={load}
        />
      )}
      {editing && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
