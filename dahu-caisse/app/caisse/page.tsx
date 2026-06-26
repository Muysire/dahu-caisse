// ============================================================
// CAISSE — interface principale (barman + admin)
// Grille de produits + panier. Optimisée rush : gros boutons,
// tap = ajout, validation atomique, vidage auto.
// ============================================================
"use client";

import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { submitSale } from "@/services/sales.service";
import { RushHeader } from "@/components/shared/RushHeader";
import { CategoryTabs, type TabItem } from "@/components/caisse/CategoryTabs";
import { ProductCard } from "@/components/caisse/ProductCard";
import { VariantPickerModal } from "@/components/caisse/VariantPickerModal";
import { Cart } from "@/components/caisse/Cart";
import { toast } from "@/components/ui/Toast";
import { formatEuro } from "@/lib/utils";
import type { ProductWithVariants, ProductVariant } from "@/types/database";
import { ShoppingCart, X } from "lucide-react";

export default function CaissePage() {
  const { products, loading, error, reload } = useProducts();
  const cart = useCart();

  const [activeCat, setActiveCat] = useState("all");
  const [picker, setPicker] = useState<ProductWithVariants | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // tiroir mobile

  // Onglets de catégories
  const tabs = useMemo<TabItem[]>(() => {
    const map = new Map<string, TabItem>();
    for (const p of products) {
      if (p.category) {
        map.set(p.category.slug, {
          slug: p.category.slug,
          name: p.category.name,
          icon: p.category.icon ?? "✨",
        });
      }
    }
    return Array.from(map.values());
  }, [products]);

  // Produits filtrés par catégorie
  const filtered = useMemo(() => {
    if (activeCat === "all") return products;
    return products.filter((p) => p.category?.slug === activeCat);
  }, [products, activeCat]);

  const iconFor = (p: ProductWithVariants) => p.category?.icon ?? "✨";

  // Tap sur une carte produit
  const handleTap = (product: ProductWithVariants) => {
    if (product.variants.length === 1) {
      // Produit simple : ajout direct
      cart.addVariant(product.variants[0], product.name);
    } else {
      // Plusieurs variantes : ouvrir le sélecteur
      setPicker(product);
    }
  };

  const handlePick = (variant: ProductVariant, productName: string) => {
    cart.addVariant(variant, productName);
  };

  // Validation de la vente
  const handleValidate = async () => {
    if (cart.lines.length === 0) return;
    setSubmitting(true);
    try {
      const result = await submitSale(cart.lines);
      toast.success(
        `Vente enregistrée · ${formatEuro(result.total)} · ${result.item_count} article(s)`
      );
      cart.clear();
      setCartOpen(false);
      reload(); // rafraîchit les stocks
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la vente");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <RushHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Colonne produits */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-card-border px-4 pt-3">
            <CategoryTabs tabs={tabs} active={activeCat} onSelect={setActiveCat} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-28 lg:pb-4">
            {loading ? (
              <p className="text-center text-text-muted">Chargement des produits…</p>
            ) : error ? (
              <div className="rounded-xl border border-stock-out/40 bg-stock-out/10 p-6 text-center text-stock-out">
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-text-muted">
                Aucun produit dans cette catégorie.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    categoryIcon={iconFor(p)}
                    onTap={handleTap}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Panier latéral (desktop/tablette large) */}
        <aside className="hidden w-80 border-l border-card-border lg:flex lg:flex-col">
          <Cart onValidate={handleValidate} submitting={submitting} className="h-full" />
        </aside>
      </div>

      {/* Barre panier mobile (ouvre le tiroir) */}
      {cart.count() > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between bg-violet px-5 py-4 text-white shadow-glow-lg lg:hidden"
        >
          <span className="flex items-center gap-2 font-bold">
            <ShoppingCart size={20} />
            {cart.count()} article(s)
          </span>
          <span className="font-mono text-xl font-bold">
            {formatEuro(cart.total())}
          </span>
        </button>
      )}

      {/* Tiroir panier mobile */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
          <div
            className="flex-1 bg-black/60"
            onClick={() => setCartOpen(false)}
          />
          <div className="max-h-[85vh] animate-pop rounded-t-2xl border-t border-violet/40 bg-card">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setCartOpen(false)}
                className="text-text-muted"
                aria-label="Fermer le panier"
              >
                <X size={24} />
              </button>
            </div>
            <Cart
              onValidate={handleValidate}
              submitting={submitting}
              className="max-h-[78vh]"
            />
          </div>
        </div>
      )}

      {/* Sélecteur de variantes */}
      <VariantPickerModal
        product={picker}
        onPick={handlePick}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}
