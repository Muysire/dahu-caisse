// ============================================================
// ADMIN — Exports : téléchargement CSV (stock, ventes, achats, mouvements)
// ============================================================
"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Download, Boxes, ShoppingCart, ShoppingBag, History } from "lucide-react";

const EXPORTS = [
  {
    type: "stock",
    label: "État du stock",
    desc: "Stock actuel, seuils et prix de chaque variante.",
    icon: Boxes,
  },
  {
    type: "ventes",
    label: "Ventes",
    desc: "Toutes les lignes de vente (détail par article).",
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
    desc: "Journal complet (ventes, réappro, corrections).",
    icon: History,
  },
];

export default function AdminExportsPage() {
  return (
    <div>
      <PageHeader
        title="Exports CSV"
        subtitle="Pour ta compta & tes archives"
      />

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
                  <a
                    href={`/api/exports/${e.type}`}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-violet bg-violet/10 px-4 py-2 text-sm font-bold text-violet-light transition-colors hover:bg-violet/20"
                  >
                    <Download size={16} />
                    Télécharger le CSV
                  </a>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-text-muted">
        Les fichiers sont encodés en UTF-8 avec séparateur « ; » — ils s'ouvrent
        directement dans Excel ou LibreOffice (accents corrects).
      </p>
    </div>
  );
}
