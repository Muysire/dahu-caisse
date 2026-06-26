// ============================================================
// ADMIN — Exports CSV (100% cote client)
// Lit les donnees via Supabase puis declenche un telechargement
// via un Blob. Aucune route serveur.
// ============================================================
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toast";
import { Download, Boxes, ShoppingCart, ShoppingBag, History } from "lucide-react";

// Echappe une valeur pour le format CSV
function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(";")),
  ];
  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  return "\uFEFF" + lines.join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type ExportType = "stock" | "ventes" | "achats" | "mouvements";

const EXPORTS: {
  type: ExportType;
  label: string;
  desc: string;
  icon: typeof Boxes;
}[] = [
  {
    type: "stock",
    label: "Etat du stock",
    desc: "Stock actuel, seuils et prix de chaque variante.",
    icon: Boxes,
  },
  {
    type: "ventes",
    label: "Ventes",
    desc: "Toutes les lignes de vente (detail par article).",
    icon: ShoppingCart,
  },
  {
    type: "achats",
    label: "Achats",
    desc: "Historique des achats fournisseurs.",
    icon: ShoppingBag,
  },
  {
    type: "mouvements",
    label: "Mouvements de stock",
    desc: "Journal complet (ventes, reappro, corrections).",
    icon: History,
  },
];

export default function AdminExportsPage() {
  const [busy, setBusy] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType) => {
    setBusy(type);
    const supabase = createClient();
    try {
      let rows: Record<string, unknown>[] = [];
      let filename = "export.csv";

      if (type === "stock") {
        const { data } = await supabase
          .from("product_variants")
          .select(
            "label, code, stock, min_stock, sale_price, purchase_price, product:products(name)"
          );
        rows = (data ?? []).map((v: any) => ({
          Produit: v.product?.name ?? "",
          Variante: v.label,
          Code: v.code ?? "",
          Stock: v.stock,
          Seuil: v.min_stock,
          "Prix vente": v.sale_price,
          "Prix achat": v.purchase_price,
        }));
        filename = "stock.csv";
      } else if (type === "ventes") {
        const { data } = await supabase
          .from("sale_items")
          .select("product_name, qty, unit_price, line_total, created_at, sale_id")
          .order("created_at", { ascending: false });
        rows = (data ?? []).map((it: any) => ({
          Date: new Date(it.created_at).toLocaleString("fr-FR"),
          Ticket: it.sale_id,
          Produit: it.product_name,
          Quantite: it.qty,
          "Prix unitaire": it.unit_price,
          Total: it.line_total,
        }));
        filename = "ventes.csv";
      } else if (type === "achats") {
        const { data } = await supabase
          .from("purchases")
          .select(
            "qty, unit_purchase_price, total_cost, supplier_ref, purchase_date, supplier:suppliers(name), variant:product_variants(label, product:products(name))"
          )
          .order("purchase_date", { ascending: false });
        rows = (data ?? []).map((p: any) => ({
          Date: p.purchase_date,
          Fournisseur: p.supplier?.name ?? "",
          Produit: p.variant?.product?.name ?? "",
          Variante: p.variant?.label ?? "",
          Quantite: p.qty,
          "Prix unitaire": p.unit_purchase_price,
          "Cout total": p.total_cost,
          Reference: p.supplier_ref ?? "",
        }));
        filename = "achats.csv";
      } else if (type === "mouvements") {
        const { data } = await supabase
          .from("stock_movements")
          .select(
            "type, qty_delta, stock_after, reason, created_at, variant:product_variants(label, product:products(name))"
          )
          .order("created_at", { ascending: false });
        rows = (data ?? []).map((m: any) => ({
          Date: new Date(m.created_at).toLocaleString("fr-FR"),
          Produit: m.variant?.product?.name ?? "",
          Variante: m.variant?.label ?? "",
          Type: m.type,
          Variation: m.qty_delta,
          "Stock apres": m.stock_after,
          Motif: m.reason ?? "",
        }));
        filename = "mouvements.csv";
      }

      if (rows.length === 0) {
        toast.error("Aucune donnee a exporter pour ce type.");
        return;
      }

      downloadCsv(filename, toCsv(rows));
      toast.success("Export telecharge : " + filename);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'export");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Exports CSV" subtitle="Pour ta compta & tes archives" />

      <div className="grid gap-4 sm:grid-cols-2">
        {EXPORTS.map((e) => {
          const Icon = e.icon;
          return (
            <Card key={e.type} className="p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-violet/15 p-3 text-violet-light">
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl tracking-wide text-text-main">
                    {e.label}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">{e.desc}</p>
                  <button
                    onClick={() => handleExport(e.type)}
                    disabled={busy === e.type}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-violet bg-violet/10 px-4 py-2 text-sm font-bold text-violet-light transition-colors hover:bg-violet/20 disabled:opacity-50"
                  >
                    <Download size={16} />
                    {busy === e.type ? "Preparation..." : "Telecharger le CSV"}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-text-muted">
        Les fichiers sont encodes en UTF-8 avec separateur point-virgule -- ils
        s&apos;ouvrent directement dans Excel ou LibreOffice (accents corrects).
      </p>
    </div>
  );
}
