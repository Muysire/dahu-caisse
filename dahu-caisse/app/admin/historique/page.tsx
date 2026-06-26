// ============================================================
// ADMIN — Historique : ventes + mouvements de stock (onglets, filtre date)
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatEuro, formatDateTime, movementLabel, cn } from "@/lib/utils";
import type { Sale, SaleItem, StockMovement } from "@/types/database";

type Tab = "ventes" | "mouvements";

export default function AdminHistoryPage() {
  const [tab, setTab] = useState<Tab>("ventes");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [sales, setSales] = useState<(Sale & { items: SaleItem[] })[]>([]);
  const [movements, setMovements] = useState<
    (StockMovement & { variant: { label: string; product: { name: string } | null } | null })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const applyDates = (q: ReturnType<typeof supabase.from> extends never ? never : any) => {
      let query = q;
      if (from) query = query.gte("created_at", new Date(from).toISOString());
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }
      return query;
    };

    if (tab === "ventes") {
      let q = supabase
        .from("sales")
        .select("*, items:sale_items(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      q = applyDates(q);
      const { data } = await q;
      setSales((data as (Sale & { items: SaleItem[] })[]) ?? []);
    } else {
      let q = supabase
        .from("stock_movements")
        .select("*, variant:product_variants(label, product:products(name))")
        .order("created_at", { ascending: false })
        .limit(150);
      q = applyDates(q);
      const { data } = await q;
      setMovements(
        (data as (StockMovement & {
          variant: { label: string; product: { name: string } | null } | null;
        })[]) ?? []
      );
    }
    setLoading(false);
  }, [tab, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Historique" subtitle="Traçabilité complète" />

      {/* Onglets + filtres */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-card-border p-1">
          {(["ventes", "mouvements"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors",
                tab === t
                  ? "bg-violet text-white"
                  : "text-text-muted hover:text-violet-light"
              )}
            >
              {t === "ventes" ? "Ventes" : "Mouvements stock"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>Du</span>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-auto"
          />
          <span>au</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-text-muted">Chargement…</p>
      ) : tab === "ventes" ? (
        <Card className="overflow-hidden">
          {sales.length === 0 ? (
            <p className="p-6 text-center text-text-muted">Aucune vente.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Articles</th>
                  <th className="px-4 py-3">Détail</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-card-border/50 align-top last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text-muted">
                      {formatDateTime(s.created_at)}
                    </td>
                    <td className="px-4 py-3 text-text-main">{s.item_count}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {s.items
                        ?.map((it) => `${it.product_name} ×${it.qty}`)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-violet-light">
                      {formatEuro(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {movements.length === 0 ? (
            <p className="p-6 text-center text-text-muted">Aucun mouvement.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-center">Variation</th>
                  <th className="px-4 py-3 text-center">Stock après</th>
                  <th className="px-4 py-3">Motif</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-card-border/50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text-muted">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="px-4 py-3 text-text-main">
                      {m.variant?.product?.name ?? "—"}{" "}
                      <span className="text-text-muted">
                        {m.variant?.label ? `— ${m.variant.label}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {movementLabel(m.type)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-center font-mono font-bold",
                        m.qty_delta < 0 ? "text-stock-out" : "text-stock-ok"
                      )}
                    >
                      {m.qty_delta > 0 ? "+" : ""}
                      {m.qty_delta}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-text-main">
                      {m.stock_after}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {m.reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
