// ============================================================
// ADMIN — Stock : tableau code couleur, réappro rapide, correction
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchAllProductsAdmin } from "@/services/products.service";
import { adjustStock } from "@/services/stock.service";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StockBadge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { stockStatus } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/database";
import { Plus, Pencil } from "lucide-react";

interface Row {
  variantId: string;
  productName: string;
  label: string;
  stock: number;
  minStock: number;
  unit: string;
}

export default function AdminStockPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockRow, setRestockRow] = useState<Row | null>(null);
  const [correctRow, setCorrectRow] = useState<Row | null>(null);

  const load = useCallback(async () => {
    const products = await fetchAllProductsAdmin();
    const r: Row[] = [];
    for (const p of products as ProductWithVariants[]) {
      for (const v of p.variants) {
        r.push({
          variantId: v.id,
          productName: p.name,
          label: v.label,
          stock: v.stock,
          minStock: v.min_stock,
          unit: v.unit,
        });
      }
    }
    // Les plus critiques en haut
    r.sort((a, b) => a.stock - a.minStock - (b.stock - b.minStock));
    setRows(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Stock" subtitle="État des stocks en temps réel" />

      {loading ? (
        <p className="text-text-muted">Chargement…</p>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-card-border text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Variante</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Seuil</th>
                <th className="px-4 py-3 text-center">État</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = stockStatus(r.stock, r.minStock);
                return (
                  <tr
                    key={r.variantId}
                    className="border-b border-card-border/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-text-main">
                      {r.productName}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{r.label}</td>
                    <td className="px-4 py-3 text-center font-mono text-lg font-bold text-text-main">
                      {r.stock}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-text-muted">
                      {r.minStock}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StockBadge status={status}>
                        {status === "out" ? "Rupture" : status === "low" ? "Bas" : "OK"}
                      </StockBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setRestockRow(r)}
                        >
                          <Plus size={14} className="mr-1 inline" /> Réappro
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCorrectRow(r)}
                        >
                          <Pencil size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {restockRow && (
        <AdjustModal
          row={restockRow}
          mode="add"
          title="Réapprovisionner"
          onClose={() => setRestockRow(null)}
          onDone={() => {
            setRestockRow(null);
            load();
          }}
        />
      )}
      {correctRow && (
        <AdjustModal
          row={correctRow}
          mode="set"
          title="Corriger le stock"
          onClose={() => setCorrectRow(null)}
          onDone={() => {
            setCorrectRow(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AdjustModal({
  row,
  mode,
  title,
  onClose,
  onDone,
}: {
  row: Row;
  mode: "add" | "set";
  title: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [value, setValue] = useState<number>(mode === "set" ? row.stock : 0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await adjustStock({
        variantId: row.variantId,
        value,
        mode,
        type: mode === "add" ? "restock" : "correction",
        reason: reason || undefined,
      });
      toast.success("Stock mis à jour");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          {row.productName} — {row.label}
          <br />
          Stock actuel :{" "}
          <span className="font-mono font-bold text-text-main">{row.stock}</span>
        </p>

        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted">
            {mode === "add" ? "Quantité à ajouter" : "Nouveau stock total"}
          </span>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            autoFocus
          />
          {mode === "add" && (
            <p className="mt-1 font-mono text-xs text-violet-light">
              Nouveau stock : {row.stock + value}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted">
            Motif (optionnel)
          </span>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={mode === "add" ? "Livraison…" : "Casse, erreur de saisie…"}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={submit} disabled={saving} className="flex-1">
            {saving ? "…" : "Valider"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
