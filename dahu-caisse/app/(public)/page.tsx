// ============================================================
// MENU PUBLIC — accessible sans connexion
// Affiche les produits visibles : photo, nom, prix, dispo.
// Aucun achat / paiement en ligne.
// ============================================================
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchPublicMenu } from "@/services/products.service";
import { DahuLogo } from "@/components/shared/DahuLogo";
import { StockBadge } from "@/components/ui/Badge";
import { formatEuro, stockStatus } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/database";
import { LogIn } from "lucide-react";

export default function PublicMenuPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicMenu()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Regroupe par catégorie
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; items: ProductWithVariants[] }>();
    for (const p of products) {
      const key = p.category?.slug ?? "autres";
      const entry = map.get(key) ?? {
        name: p.category?.name ?? "Autres",
        icon: p.category?.icon ?? "✨",
        items: [],
      };
      entry.items.push(p);
      map.set(key, entry);
    }
    return Array.from(map.values());
  }, [products]);

  return (
    <div className="min-h-screen">
      <div className="dahu-banner" />

      {/* Hero (reprend l'esprit du site vitrine) */}
      <header
        className="relative overflow-hidden border-b border-card-border px-5 py-12 text-center"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 55%), linear-gradient(160deg, #140b22 0%, #0a0710 55%, #1a0e2e 100%)",
        }}
      >
        <DahuLogo size={110} showText={false} className="mb-4 justify-center" />
        <h1 className="font-display text-5xl tracking-widest text-violet-light sm:text-6xl">
          LA CARTE
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-text-muted">
          Dahu Sound System · Bar associatif
        </p>

        <Link
          href="/login"
          className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-violet bg-violet/10 px-3 py-2 text-sm font-bold text-violet-light transition-colors hover:bg-violet/20"
        >
          <LogIn size={16} />
          Connexion
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {loading ? (
          <p className="text-center text-text-muted">Chargement de la carte…</p>
        ) : grouped.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-card p-10 text-center">
            <p className="text-text-muted">La carte n'est pas encore disponible.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map((cat) => (
              <section key={cat.name}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <h2 className="font-display text-3xl tracking-wide text-violet-light">
                    {cat.name}
                  </h2>
                </div>
                <div className="dahu-divider mb-6" />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {cat.items.map((product) =>
                    product.variants.map((v) => {
                      const status = stockStatus(v.stock, v.min_stock);
                      return (
                        <div
                          key={v.id}
                          className="overflow-hidden rounded-xl border border-card-border bg-card transition-all hover:border-violet-light hover:shadow-card"
                        >
                          <div className="relative aspect-square bg-bg">
                            {v.photo_url ? (
                              <Image
                                src={v.photo_url}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 50vw, 25vw"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-5xl opacity-30">
                                {cat.icon}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="font-display text-lg leading-tight tracking-wide text-text-main">
                              {product.name}
                            </div>
                            {product.variants.length > 1 && (
                              <div className="text-xs text-text-muted">{v.label}</div>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <span className="font-mono text-lg font-bold text-violet-light">
                                {formatEuro(v.sale_price)}
                              </span>
                              <StockBadge status={status}>
                                {status === "out"
                                  ? "Épuisé"
                                  : status === "low"
                                  ? "Stock bas"
                                  : "Dispo"}
                              </StockBadge>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-card-border px-4 py-8 text-center">
        <div className="dahu-divider mx-auto mb-5 max-w-xs" />
        <span className="font-display text-xl tracking-widest text-violet-light">
          Dahu Sound System
        </span>
        <p className="mt-1 text-xs text-text-muted">
          Association loi 1901 · One Love, One Sound
        </p>
      </footer>
    </div>
  );
}
