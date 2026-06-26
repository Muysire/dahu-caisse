// ============================================================
// DASHBOARD ADMIN — KPIs + alertes stock + ventes récentes
// ============================================================
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchDashboardStats, type DashboardStats } from "@/services/stats.service";
import { fetchAllProductsAdmin } from "@/services/products.service";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { StockBadge } from "@/components/ui/Badge";
import { formatEuro, formatDateTime, stockStatus } from "@/lib/utils";
import type { ProductWithVariants, Sale } from "@/types/database";
import { TrendingUp, ShoppingCart, AlertTriangle, Euro } from "lucide-react";

interface LowVariant {
  productName: string;
  label: string;
  stock: number;
  minStock: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [low, setLow] = useState<LowVariant[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [statsData, products, sales] = await Promise.all([
        fetchDashboardStats(),
        fetchAllProductsAdmin(),
        supabase
          .from("sales")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      setStats(statsData);

      // Variantes en alerte (orange ou rouge)
      const lows: LowVariant[] = [];
      for (const p of products as ProductWithVariants[]) {
        for (const v of p.variants) {
          const status = stockStatus(v.stock, v.min_stock);
          if (status !== "ok") {
            lows.push({
              productName: p.name,
              label: v.label,
              stock: v.stock,
              minStock: v.min_stock,
            });
          }
        }
      }
      lows.sort((a, b) => a.stock - b.stock);
      setLow(lows);
      setRecentSales((sales.data as Sale[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Vue d'ensemble de la soirée" />

      {loading ? (
        <p className="text-text-muted">Chargement…</p>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              icon={<Euro size={20} />}
              label="CA du jour"
              value={formatEuro(stats?.todayRevenue ?? 0)}
            />
            <KpiCard
              icon={<ShoppingCart size={20} />}
              label="Ventes du jour"
              value={String(stats?.todayCount ?? 0)}
            />
            <KpiCard
              icon={<TrendingUp size={20} />}
              label="CA total"
              value={formatEuro(stats?.totalRevenue ?? 0)}
            />
            <KpiCard
              icon={<AlertTriangle size={20} />}
              label="Alertes stock"
              value={String(low.length)}
              alert={low.length > 0}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Alertes stock */}
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl tracking-wide text-violet-light">
                  Alertes stock
                </h2>
                <Link
                  href="/admin/stock"
                  className="text-sm text-text-muted hover:text-violet-light"
                >
                  Gérer →
                </Link>
              </div>
              {low.length === 0 ? (
                <p className="py-6 text-center text-sm text-stock-ok">
                  ✓ Tous les stocks sont au vert
                </p>
              ) : (
                <ul className="space-y-2">
                  {low.slice(0, 8).map((v, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-bg px-3 py-2"
                    >
                      <span className="text-sm text-text-main">
                        {v.productName}{" "}
                        <span className="text-text-muted">— {v.label}</span>
                      </span>
                      <StockBadge status={v.stock <= 0 ? "out" : "low"}>
                        {v.stock} / {v.minStock}
                      </StockBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Ventes récentes */}
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl tracking-wide text-violet-light">
                  Dernières ventes
                </h2>
                <Link
                  href="/admin/historique"
                  className="text-sm text-text-muted hover:text-violet-light"
                >
                  Tout voir →
                </Link>
              </div>
              {recentSales.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Aucune vente pour l'instant
                </p>
              ) : (
                <ul className="space-y-2">
                  {recentSales.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg bg-bg px-3 py-2"
                    >
                      <span className="font-mono text-xs text-text-muted">
                        {formatDateTime(s.created_at)}
                      </span>
                      <span className="text-sm text-text-main">
                        {s.item_count} art.
                      </span>
                      <span className="font-mono font-bold text-violet-light">
                        {formatEuro(s.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <Card className="p-4" >
      <div className="mb-2 flex items-center gap-2 text-text-muted">
        <span className={alert ? "text-stock-low" : "text-violet-light"}>
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div
        className={`font-mono text-2xl font-bold ${
          alert ? "text-stock-low" : "text-text-main"
        }`}
      >
        {value}
      </div>
    </Card>
  );
}
