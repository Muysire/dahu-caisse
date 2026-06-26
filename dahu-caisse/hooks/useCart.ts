// ============================================================
// Hook panier — état global via Zustand (persistant en session)
// Conçu pour le RUSH : ajout/retrait ultra-rapides, total instantané.
// ============================================================
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, ProductVariant } from "@/types/database";

interface CartState {
  lines: CartLine[];
  /** Ajoute une variante au panier (ou incrémente si déjà présente). */
  addVariant: (variant: ProductVariant, productName: string) => void;
  /** Modifie la quantité d'une ligne (supprime si <= 0). */
  setQty: (variantId: string, qty: number) => void;
  /** Incrémente / décrémente d'une unité. */
  increment: (variantId: string) => void;
  decrement: (variantId: string) => void;
  /** Retire une ligne. */
  remove: (variantId: string) => void;
  /** Vide le panier. */
  clear: () => void;
  /** Total en euros. */
  total: () => number;
  /** Nombre total d'articles. */
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      addVariant: (variant, productName) => {
        const lines = [...get().lines];
        const idx = lines.findIndex((l) => l.variantId === variant.id);

        if (idx >= 0) {
          // Déjà au panier : on incrémente sans dépasser le stock
          const line = lines[idx];
          if (line.qty < variant.stock) {
            lines[idx] = { ...line, qty: line.qty + 1 };
          }
        } else {
          if (variant.stock <= 0) return; // rupture : on n'ajoute pas
          lines.push({
            variantId: variant.id,
            productName: `${productName} — ${variant.label}`,
            label: variant.label,
            salePrice: variant.sale_price,
            qty: 1,
            stock: variant.stock,
            photoUrl: variant.photo_url,
          });
        }
        set({ lines });
      },

      setQty: (variantId, qty) => {
        let lines = [...get().lines];
        const idx = lines.findIndex((l) => l.variantId === variantId);
        if (idx < 0) return;
        if (qty <= 0) {
          lines = lines.filter((l) => l.variantId !== variantId);
        } else {
          const capped = Math.min(qty, lines[idx].stock);
          lines[idx] = { ...lines[idx], qty: capped };
        }
        set({ lines });
      },

      increment: (variantId) => {
        const line = get().lines.find((l) => l.variantId === variantId);
        if (line) get().setQty(variantId, line.qty + 1);
      },

      decrement: (variantId) => {
        const line = get().lines.find((l) => l.variantId === variantId);
        if (line) get().setQty(variantId, line.qty - 1);
      },

      remove: (variantId) =>
        set({ lines: get().lines.filter((l) => l.variantId !== variantId) }),

      clear: () => set({ lines: [] }),

      total: () =>
        get().lines.reduce((s, l) => s + l.salePrice * l.qty, 0),

      count: () => get().lines.reduce((s, l) => s + l.qty, 0),
    }),
    { name: "dahu-cart" } // sauvegarde locale (anti perte en cas de refresh)
  )
);
