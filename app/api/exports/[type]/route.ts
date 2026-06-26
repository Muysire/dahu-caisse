// ============================================================
// API — Export CSV (admin uniquement)
// Types : stock, ventes, achats, mouvements
// Renvoie un fichier .csv téléchargeable (séparateur ; pour Excel FR).
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

// Échappe une valeur pour le format CSV
function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { type } = await params;
  const supabase = await createClient();
  let rows: Record<string, unknown>[] = [];
  let filename = "export.csv";

  try {
    switch (type) {
      case "stock": {
        const { data } = await supabase
          .from("product_variants")
          .select("label, code, stock, min_stock, sale_price, purchase_price, product:products(name)");
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
        break;
      }
      case "ventes": {
        const { data } = await supabase
          .from("sale_items")
          .select("product_name, qty, unit_price, line_total, created_at, sale_id")
          .order("created_at", { ascending: false });
        rows = (data ?? []).map((it: any) => ({
          Date: new Date(it.created_at).toLocaleString("fr-FR"),
          Ticket: it.sale_id,
          Produit: it.product_name,
          Quantité: it.qty,
          "Prix unitaire": it.unit_price,
          Total: it.line_total,
        }));
        filename = "ventes.csv";
        break;
      }
      case "achats": {
        const { data } = await supabase
          .from("purchases")
          .select("qty, unit_purchase_price, total_cost, supplier_ref, purchase_date, supplier:suppliers(name), variant:product_variants(label, product:products(name))")
          .order("purchase_date", { ascending: false });
        rows = (data ?? []).map((p: any) => ({
          Date: p.purchase_date,
          Fournisseur: p.supplier?.name ?? "",
          Produit: p.variant?.product?.name ?? "",
          Variante: p.variant?.label ?? "",
          Quantité: p.qty,
          "Prix unitaire": p.unit_purchase_price,
          "Coût total": p.total_cost,
          Référence: p.supplier_ref ?? "",
        }));
        filename = "achats.csv";
        break;
      }
      case "mouvements": {
        const { data } = await supabase
          .from("stock_movements")
          .select("type, qty_delta, stock_after, reason, created_at, variant:product_variants(label, product:products(name))")
          .order("created_at", { ascending: false });
        rows = (data ?? []).map((m: any) => ({
          Date: new Date(m.created_at).toLocaleString("fr-FR"),
          Produit: m.variant?.product?.name ?? "",
          Variante: m.variant?.label ?? "",
          Type: m.type,
          Variation: m.qty_delta,
          "Stock après": m.stock_after,
          Motif: m.reason ?? "",
        }));
        filename = "mouvements.csv";
        break;
      }
      default:
        return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
    }

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 500 }
    );
  }
}
