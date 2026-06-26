// ============================================================
// ProductCard — grande carte produit tactile (caisse)
// Un tap = ajout direct (si 1 variante) ou ouverture du sélecteur.
// ============================================================
"use client";

import Image from "next/image";
import { formatEuro, stockStatus, cn } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/database";

export function ProductCard({
  product,
  categoryIcon,
  onTap,
}: {
  product: ProductWithVariants;
  categoryIcon: string;
  onTap: (product: ProductWithVariants) => void;
}) {
  // Stock cumulé de toutes les variantes
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const isOut = totalStock <= 0;

  // Prix affiché : "à partir de" si plusieurs variantes
  const minPrice = Math.min(...product.variants.map((v) => v.sale_price));
  const hasMultiple = product.variants.length > 1;

  // Statut le plus favorable parmi les variantes
  const anyOk = product.variants.some(
    (v) => stockStatus(v.stock, v.min_stock) === "ok"
  );
  const status = isOut ? "out" : anyOk ? "ok" : "low";

  const firstPhoto = product.variants.find((v) => v.photo_url)?.photo_url;

  return (
    <button
      onClick={() => !isOut && onTap(product)}
      disabled={isOut}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all active:scale-95",
        isOut
          ? "border-card-border opacity-50"
          : "border-card-border hover:border-violet-light hover:shadow-card"
      )}
    >
      <div className="relative aspect-square w-full bg-bg">
        {firstPhoto ? (
          <Image
            src={firstPhoto}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl opacity-25">
            {categoryIcon}
          </div>
        )}

        {/* Pastille de stock */}
        <span
          className={cn(
            "absolute right-2 top-2 h-3 w-3 rounded-full",
            status === "ok"
              ? "bg-stock-ok"
              : status === "low"
              ? "bg-stock-low"
              : "bg-stock-out"
          )}
        />

        {isOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-md bg-stock-out px-2 py-1 text-xs font-bold uppercase text-white">
              Épuisé
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="font-display text-lg leading-tight tracking-wide text-text-main">
          {product.name}
        </div>
        <div className="mt-auto pt-2 font-mono text-lg font-bold text-violet-light">
          {hasMultiple && (
            <span className="mr-1 text-xs font-normal text-text-muted">dès</span>
          )}
          {formatEuro(minPrice)}
        </div>
      </div>
    </button>
  );
}
