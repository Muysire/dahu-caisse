// ============================================================
// ADMIN — Prévisions : estime les besoins selon la fréquentation
// Méthode : litres attendus par catégorie → nb d'unités selon le
// volume (cl) de chaque variante → comparaison avec le stock actuel.
// ============================================================
"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAllProductsAdmin } from "@/services/products.service";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input, Field } from "@/components/ui/Input";
import { StockBadge } from "@/components/ui/Badge";
import type { ProductWithVariants } from "@/types/database";

// Associe une catégorie (slug) au type de boisson pour la conso/personne
const CATEGORY_DRINK: Record<string, "beer" | "soft" | "alcohol"> = {
  bieres: "beer",
  softs: "soft",
  alcools: "alcohol",
};

interface ForecastRow {
  productName: string;
  label: string;
  volumeCl: number | null;
  recommended: number;
  current: number;
}

export default function AdminForecastPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  // Paramètres de prévision
  const [nbPeople, setNbPeople] = useState(200);
  const [nbDays, setNbDays] = useState(1);
  const [litersBeer, setLitersBeer] = useState(1.5);
  const [litersSoft, setLitersSoft] = useState(0.5);
  const [litersAlcohol, setLitersAlcohol] = useState(0.2);

  useEffect(() => {
    fetchAllProductsAdmin()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo<ForecastRow[]>(() => {
    const litersByType = {
      beer: litersBeer * nbPeople * nbDays,
      soft: litersSoft * nbPeople * nbDays,
      alcohol: litersAlcohol * nbPeople * nbDays,
    };

    // Pour chaque type, on répartit le volume total sur les variantes
    // disponibles de ce type (au prorata égal entre variantes).
    const result: ForecastRow[] = [];

    for (const type of ["beer", "soft", "alcohol"] as const) {
      const variantsOfType: { p: ProductWithVariants; vIndex: number }[] = [];
      for (const p of products) {
        const drink = p.category ? CATEGORY_DRINK[p.category.slug] : undefined;
        if (drink === type) {
          p.variants.forEach((_, vIndex) => variantsOfType.push({ p, vIndex }));
        }
      }
      if (variantsOfType.length === 0) continue;

      // Litres à répartir également entre les variantes de ce type
      const litersPerVariant = litersByType[type] / variantsOfType.length;

      for (const { p, vIndex } of variantsOfType) {
        const v = p.variants[vIndex];
        const volumeL = v.volume_cl ? v.volume_cl / 100 : null;
        const recommended = volumeL
          ? Math.ceil(litersPerVariant / volumeL)
          : 0;
        result.push({
          productName: p.name,
          label: v.label,
          volumeCl: v.volume_cl,
          recommended,
          current: v.stock,
        });
      }
    }

    return result;
  }, [products, nbPeople, nbDays, litersBeer, litersSoft, litersAlcohol]);

  return (
    <div>
      <PageHeader
        title="Prévisions"
        subtitle="Anticipe les besoins en stock"
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Paramètres */}
        <Card className="h-fit p-5">
          <h2 className="mb-4 font-display text-2xl tracking-wide text-violet-light">
            Paramètres
          </h2>
          <div className="space-y-4">
            <Field label="Nombre de personnes">
              <Input
                type="number"
                value={nbPeople}
                onChange={(e) => setNbPeople(Number(e.target.value))}
              />
            </Field>
            <Field label="Nombre de jours">
              <Input
                type="number"
                value={nbDays}
                onChange={(e) => setNbDays(Number(e.target.value))}
              />
            </Field>
            <div className="dahu-divider my-2" />
            <p className="text-xs uppercase tracking-wide text-text-muted">
              Consommation par personne / jour
            </p>
            <Field label="Bière (litres)">
              <Input
                type="number"
                step="0.1"
                value={litersBeer}
                onChange={(e) => setLitersBeer(Number(e.target.value))}
              />
            </Field>
            <Field label="Soft (litres)">
              <Input
                type="number"
                step="0.1"
                value={litersSoft}
                onChange={(e) => setLitersSoft(Number(e.target.value))}
              />
            </Field>
            <Field label="Alcool fort (litres)">
              <Input
                type="number"
                step="0.1"
                value={litersAlcohol}
                onChange={(e) => setLitersAlcohol(Number(e.target.value))}
              />
            </Field>
          </div>
        </Card>

        {/* Résultats */}
        <Card className="overflow-hidden">
          {loading ? (
            <p className="p-5 text-text-muted">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="p-5 text-text-muted">
              Renseigne le volume (cl) des variantes de boissons pour activer le
              calcul. (Produits → éditer → champ « Volume »)
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Variante</th>
                  <th className="px-4 py-3 text-center">Recommandé</th>
                  <th className="px-4 py-3 text-center">En stock</th>
                  <th className="px-4 py-3 text-center">Manque</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const missing = Math.max(0, r.recommended - r.current);
                  return (
                    <tr
                      key={i}
                      className="border-b border-card-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-semibold text-text-main">
                        {r.productName}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{r.label}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-violet-light">
                        {r.recommended}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-text-main">
                        {r.current}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {missing > 0 ? (
                          <StockBadge status="out">+{missing}</StockBadge>
                        ) : (
                          <StockBadge status="ok">OK</StockBadge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <p className="mt-4 text-xs text-text-muted">
        Estimation indicative : les litres attendus par catégorie sont répartis
        entre les variantes, puis convertis en nombre d'unités selon leur volume.
      </p>
    </div>
  );
}
