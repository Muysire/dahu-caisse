// ============================================================
// ADMIN — Achats : enregistre un achat fournisseur (réappro le stock)
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllProductsAdmin } from "@/services/products.service";
import { recordPurchase } from "@/services/stock.service";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { formatEuro, formatDate } from "@/lib/utils";
import type { ProductWithVariants, Supplier, Purchase } from "@/types/database";

interface VariantOption {
  id: string;
  label: string;
}

export default function AdminPurchasesPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [recent, setRecent] = useState<
    (Purchase & { supplier: Supplier | null })[]
  >([]);

  const [supplierId, setSupplierId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: sup }, products, { data: purchases }] = await Promise.all([
      supabase.from("suppliers").select("*").order("name"),
      fetchAllProductsAdmin(),
      supabase
        .from("purchases")
        .select("*, supplier:suppliers(*)")
        .order("purchase_date", { ascending: false })
        .limit(10),
    ]);

    setSuppliers((sup as Supplier[]) ?? []);

    const opts: VariantOption[] = [];
    for (const p of products as ProductWithVariants[]) {
      for (const v of p.variants) {
        opts.push({ id: v.id, label: `${p.name} — ${v.label}` });
      }
    }
    setVariantOptions(opts);
    if (opts[0]) setVariantId((prev) => prev || opts[0].id);
    setRecent((purchases as (Purchase & { supplier: Supplier | null })[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!variantId || qty <= 0) {
      toast.error("Sélectionne un produit et une quantité valide");
      return;
    }
    setSaving(true);
    try {
      await recordPurchase({
        supplierId: supplierId || null,
        variantId,
        qty,
        unitPrice,
        supplierRef: ref || undefined,
        date,
      });
      toast.success("Achat enregistré · stock réapprovisionné");
      setQty(1);
      setUnitPrice(0);
      setRef("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Achats" subtitle="Saisie des achats fournisseurs" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire d'achat */}
        <Card className="h-fit p-5">
          <h2 className="mb-4 font-display text-2xl tracking-wide text-violet-light">
            Nouvel achat
          </h2>
          <div className="space-y-4">
            <Field label="Fournisseur">
              <Select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">— Aucun —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Produit / variante">
              <Select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
              >
                {variantOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Quantité">
                <Input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </Field>
              <Field label="Prix unitaire (€)">
                <Input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Référence (optionnel)">
                <Input value={ref} onChange={(e) => setRef(e.target.value)} />
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>

            <div className="rounded-lg bg-bg p-3 text-center">
              <span className="text-xs uppercase tracking-wide text-text-muted">
                Coût total
              </span>
              <div className="font-mono text-2xl font-bold text-violet-light">
                {formatEuro(qty * unitPrice)}
              </div>
            </div>

            <Button onClick={submit} disabled={saving} className="w-full" size="lg">
              {saving ? "Enregistrement…" : "Enregistrer l'achat"}
            </Button>
          </div>
        </Card>

        {/* Achats récents */}
        <Card className="p-5">
          <h2 className="mb-4 font-display text-2xl tracking-wide text-violet-light">
            Achats récents
          </h2>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              Aucun achat enregistré
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-bg px-3 py-2"
                >
                  <div>
                    <div className="text-sm text-text-main">
                      {p.supplier?.name ?? "Sans fournisseur"}
                    </div>
                    <div className="font-mono text-xs text-text-muted">
                      {formatDate(p.purchase_date)} · ×{p.qty}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-violet-light">
                    {formatEuro(p.total_cost)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
