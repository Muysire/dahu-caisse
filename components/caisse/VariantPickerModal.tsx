// ============================================================
// VariantPickerModal — choix de la taille/contenant au tap
// S'ouvre seulement si le produit a plusieurs variantes.
// ============================================================
"use client";

import { Modal } from "@/components/ui/Modal";
import { formatEuro, stockStatus, cn } from "@/lib/utils";
import type { ProductWithVariants, ProductVariant } from "@/types/database";

export function VariantPickerModal({
  product,
  onPick,
  onClose,
}: {
  product: ProductWithVariants | null;
  onPick: (variant: ProductVariant, productName: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title={product?.name}
      maxWidth="max-w-sm"
    >
      {product && (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">Choisis le format :</p>
          {product.variants.map((v) => {
            const status = stockStatus(v.stock, v.min_stock);
            const isOut = v.stock <= 0;
            return (
              <button
                key={v.id}
                disabled={isOut}
                onClick={() => {
                  onPick(v, product.name);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all active:scale-95",
                  isOut
                    ? "border-card-border opacity-40"
                    : "border-card-border hover:border-violet-light hover:bg-violet/10"
                )}
              >
                <div>
                  <div className="font-display text-xl tracking-wide text-text-main">
                    {v.label}
                  </div>
                  <div className="text-xs text-text-muted">
                    {isOut ? (
                      <span className="text-stock-out">Épuisé</span>
                    ) : (
                      <span
                        className={cn(
                          status === "low" ? "text-stock-low" : "text-stock-ok"
                        )}
                      >
                        {v.stock} en stock
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono text-xl font-bold text-violet-light">
                  {formatEuro(v.sale_price)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
