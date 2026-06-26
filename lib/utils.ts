// ============================================================
// Utilitaires partagés
// ============================================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StockStatus } from "@/types/database";

/** Fusionne les classes Tailwind proprement. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un montant en euros (format français). */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/** Formate une date en français (jj/mm/aaaa hh:mm). */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Formate une date seule (jj/mm/aaaa). */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
    new Date(iso)
  );
}

/** Détermine le statut de stock pour le code couleur. */
export function stockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= minStock) return "low";
  return "ok";
}

/** Classes Tailwind associées à un statut de stock. */
export function stockStatusClasses(status: StockStatus): string {
  switch (status) {
    case "ok":
      return "text-stock-ok border-stock-ok/40 bg-stock-ok/10";
    case "low":
      return "text-stock-low border-stock-low/40 bg-stock-low/10";
    case "out":
      return "text-stock-out border-stock-out/40 bg-stock-out/10";
  }
}

/** Libellé lisible d'un type de mouvement de stock. */
export function movementLabel(type: string): string {
  const labels: Record<string, string> = {
    sale: "Vente",
    restock: "Réapprovisionnement",
    inventory: "Inventaire",
    correction: "Correction",
    initial: "Stock initial",
  };
  return labels[type] ?? type;
}

/**
 * Préfixe un chemin d'asset local avec le basePath GitHub Pages.
 * Ex: asset("/images/logo.png") -> "/dahu-caisse/images/logo.png" en prod.
 * (Inutile pour les URL Supabase qui sont déjà absolues.)
 */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path}`;
}
