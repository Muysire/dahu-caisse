// ============================================================
// Service Statistiques — agrégations CA, top produits (admin)
// ============================================================
import { createClient } from "@/lib/supabase/client";

export interface DashboardStats {
  todayRevenue: number;
  todayCount: number;
  totalRevenue: number;
  totalSales: number;
}

export interface TopProduct {
  product_name: string;
  qty: number;
  revenue: number;
}

export interface DailyRevenue {
  day: string; // jj/mm
  revenue: number;
}

/** KPIs du dashboard (CA du jour + total). */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [{ data: today }, { data: all }] = await Promise.all([
    supabase.from("sales").select("total").gte("created_at", startOfToday.toISOString()),
    supabase.from("sales").select("total"),
  ]);

  const todayRevenue = (today ?? []).reduce((s, r) => s + Number(r.total), 0);
  const totalRevenue = (all ?? []).reduce((s, r) => s + Number(r.total), 0);

  return {
    todayRevenue,
    todayCount: today?.length ?? 0,
    totalRevenue,
    totalSales: all?.length ?? 0,
  };
}

/** Top produits par quantité vendue. */
export async function fetchTopProducts(limit = 10): Promise<TopProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sale_items")
    .select("product_name, qty, line_total");

  if (error) throw error;

  const map = new Map<string, TopProduct>();
  for (const item of data ?? []) {
    const key = item.product_name;
    const prev = map.get(key) ?? { product_name: key, qty: 0, revenue: 0 };
    prev.qty += item.qty;
    prev.revenue += Number(item.line_total);
    map.set(key, prev);
  }

  return Array.from(map.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

/** CA par jour sur les N derniers jours. */
export async function fetchDailyRevenue(days = 14): Promise<DailyRevenue[]> {
  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("sales")
    .select("total, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  const map = new Map<string, number>();
  for (const sale of data ?? []) {
    const d = new Date(sale.created_at);
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + Number(sale.total));
  }

  return Array.from(map.entries()).map(([day, revenue]) => ({ day, revenue }));
}
