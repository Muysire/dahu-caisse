// ============================================================
// Cart — panier (latéral desktop / tiroir mobile)
// Affiche lignes, quantités +/-, total, récap "à préparer", Valider.
// ============================================================
"use client";

import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { formatEuro, cn } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

export function Cart({
  onValidate,
  submitting,
  className,
}: {
  onValidate: () => void;
  submitting: boolean;
  className?: string;
}) {
  const { lines, increment, decrement, remove, clear, total, count } = useCart();
  const isEmpty = lines.length === 0;

  return (
    <div className={cn("flex flex-col bg-card", className)}>
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} className="text-violet-light" />
          <span className="font-display text-xl tracking-wide text-text-main">
            Panier
          </span>
          {count() > 0 && (
            <span className="rounded-full bg-violet px-2 py-0.5 text-xs font-bold text-white">
              {count()}
            </span>
          )}
        </div>
        {!isEmpty && (
          <button
            onClick={clear}
            className="text-sm text-text-muted transition-colors hover:text-stock-out"
          >
            Vider
          </button>
        )}
      </div>

      {/* Lignes */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center text-text-muted">
            <ShoppingCart size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Tape un produit pour l'ajouter</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {lines.map((l) => (
              <li
                key={l.variantId}
                className="rounded-lg border border-card-border bg-bg p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-text-main">
                      {l.productName}
                    </div>
                    <div className="font-mono text-xs text-text-muted">
                      {formatEuro(l.salePrice)} × {l.qty} ={" "}
                      <span className="text-violet-light">
                        {formatEuro(l.salePrice * l.qty)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(l.variantId)}
                    className="text-text-muted transition-colors hover:text-stock-out"
                    aria-label="Retirer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Contrôles quantité */}
                <div className="mt-2 flex items-center gap-2">
                  <QtyButton onClick={() => decrement(l.variantId)}>
                    <Minus size={16} />
                  </QtyButton>
                  <span className="w-8 text-center font-mono text-lg font-bold text-text-main">
                    {l.qty}
                  </span>
                  <QtyButton
                    onClick={() => increment(l.variantId)}
                    disabled={l.qty >= l.stock}
                  >
                    <Plus size={16} />
                  </QtyButton>
                  {l.qty >= l.stock && (
                    <span className="text-[10px] uppercase text-stock-low">
                      max
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Récap à préparer + total + valider */}
      {!isEmpty && (
        <div className="border-t border-card-border p-4">
          <div className="mb-3 rounded-lg bg-bg p-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              À préparer
            </div>
            <div className="space-y-0.5 font-mono text-sm text-text-main">
              {lines.map((l) => (
                <div key={l.variantId} className="flex justify-between">
                  <span className="truncate">{l.productName}</span>
                  <span className="ml-2 shrink-0 text-violet-light">×{l.qty}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-end justify-between">
            <span className="text-sm uppercase tracking-wide text-text-muted">
              Total
            </span>
            <span className="font-mono text-3xl font-bold text-violet-light">
              {formatEuro(total())}
            </span>
          </div>

          <Button
            onClick={onValidate}
            disabled={submitting}
            size="xl"
            className="w-full"
          >
            {submitting ? "Enregistrement…" : "✓ Valider"}
          </Button>
          <p className="mt-2 text-center text-[11px] text-text-muted">
            Paiement à encaisser sur le TPE
          </p>
        </div>
      )}
    </div>
  );
}

function QtyButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-text-main transition-all hover:border-violet active:scale-90 disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}
