// ============================================================
// ADMIN — Statistiques : CA, top produits, marges (graphiques recharts)
// ============================================================
"use client";

import { useEffect, useState } from "react";
import {
  fetchDashboardStats,
  fetchTopProducts,
  fetchDailyRevenue,
  type DashboardStats,
  type TopProduct,
  type DailyRevenue,
} from "@/services/stats.service";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { formatEuro } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function AdminStatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [top, setTop] = useState<TopProduct[]>([]);
  const [daily, setDaily] = useState<DailyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(),
      fetchTopProducts(8),
      fetchDailyRevenue(14),
    ]).then(([s, t, d]) => {
      setStats(s);
      setTop(t);
      setDaily(d);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader title="Statistiques" subtitle="Performance des ventes" />

      {loading ? (
        <p className="text-text-muted">Chargement…</p>
      ) : (
        <div className="space-y-6">
          {/* Synthèse */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="CA total" value={formatEuro(stats?.totalRevenue ?? 0)} />
            <StatCard label="Ventes" value={String(stats?.totalSales ?? 0)} />
            <StatCard label="CA du jour" value={formatEuro(stats?.todayRevenue ?? 0)} />
            <StatCard
              label="Panier moyen"
              value={formatEuro(
                stats && stats.totalSales > 0
                  ? stats.totalRevenue / stats.totalSales
                  : 0
              )}
            />
          </div>

          {/* CA par jour */}
          <Card className="p-5">
            <h2 className="mb-4 font-display text-2xl tracking-wide text-violet-light">
              CA des 14 derniers jours
            </h2>
            {daily.length === 0 ? (
              <p className="py-10 text-center text-text-muted">Pas encore de données</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#241a38" />
                  <XAxis dataKey="day" stroke="#9a8fb0" fontSize={12} />
                  <YAxis stroke="#9a8fb0" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#120d1c",
                      border: "1px solid #7c3aed",
                      borderRadius: 8,
                      color: "#f2eefb",
                    }}
                    formatter={(v: number) => [formatEuro(v), "CA"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ fill: "#7c3aed", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Top produits */}
          <Card className="p-5">
            <h2 className="mb-4 font-display text-2xl tracking-wide text-violet-light">
              Top produits (quantités vendues)
            </h2>
            {top.length === 0 ? (
              <p className="py-10 text-center text-text-muted">Pas encore de données</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#241a38" />
                  <XAxis type="number" stroke="#9a8fb0" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="product_name"
                    stroke="#9a8fb0"
                    fontSize={11}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#120d1c",
                      border: "1px solid #7c3aed",
                      borderRadius: 8,
                      color: "#f2eefb",
                    }}
                    formatter={(v: number, name) => [
                      name === "qty" ? `${v} vendus` : formatEuro(v),
                      name === "qty" ? "Quantité" : "CA",
                    ]}
                  />
                  <Bar dataKey="qty" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Tableau détaillé top produits + CA */}
          <Card className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3 text-center">Quantité</th>
                  <th className="px-4 py-3 text-right">CA généré</th>
                </tr>
              </thead>
              <tbody>
                {top.map((t) => (
                  <tr
                    key={t.product_name}
                    className="border-b border-card-border/50 last:border-0"
                  >
                    <td className="px-4 py-3 text-text-main">{t.product_name}</td>
                    <td className="px-4 py-3 text-center font-mono text-text-main">
                      {t.qty}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-violet-light">
                      {formatEuro(t.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-bold text-text-main">{value}</div>
    </Card>
  );
}
