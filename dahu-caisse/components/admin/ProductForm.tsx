// ============================================================
// ProductForm — création / édition d'un produit et de ses variantes
// Upload de photo vers Supabase Storage (bucket "photos").
// ============================================================
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { Plus, Trash2, Upload } from "lucide-react";
import type { Category, ProductWithVariants } from "@/types/database";

interface VariantDraft {
  id?: string;
  label: string;
  code: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  volume_cl: number | null;
  photo_url: string | null;
}

export function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductWithVariants | null; // null = création
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.category_id ?? categories[0]?.id ?? ""
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [visible, setVisible] = useState(product?.visible ?? true);
  const [displayOrder, setDisplayOrder] = useState(product?.display_order ?? 0);
  const [saving, setSaving] = useState(false);

  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.map((v) => ({
      id: v.id,
      label: v.label,
      code: v.code ?? "",
      purchase_price: v.purchase_price,
      sale_price: v.sale_price,
      stock: v.stock,
      min_stock: v.min_stock,
      unit: v.unit,
      volume_cl: v.volume_cl,
      photo_url: v.photo_url,
    })) ?? [
      {
        label: "Standard",
        code: "",
        purchase_price: 0,
        sale_price: 0,
        stock: 0,
        min_stock: 0,
        unit: "unité",
        volume_cl: null,
        photo_url: null,
      },
    ]
  );

  const updateVariant = (i: number, patch: Partial<VariantDraft>) => {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        label: "",
        code: "",
        purchase_price: 0,
        sale_price: 0,
        stock: 0,
        min_stock: 0,
        unit: "unité",
        volume_cl: null,
        photo_url: null,
      },
    ]);
  };

  const removeVariant = (i: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  };

  // Upload d'une photo dans le bucket "photos"
  const uploadPhoto = async (i: number, file: File) => {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file);
    if (error) {
      toast.error("Échec de l'upload : " + error.message);
      return;
    }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    updateVariant(i, { photo_url: data.publicUrl });
    toast.success("Photo ajoutée");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Le nom du produit est obligatoire");
      return;
    }
    if (variants.length === 0) {
      toast.error("Ajoute au moins une variante");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      let productId = product?.id;

      if (isEdit && productId) {
        const { error } = await supabase
          .from("products")
          .update({
            name,
            category_id: categoryId || null,
            description: description || null,
            active,
            visible,
            display_order: displayOrder,
          })
          .eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({
            name,
            category_id: categoryId || null,
            description: description || null,
            active,
            visible,
            display_order: displayOrder,
          })
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Variantes : upsert
      const isSingle = variants.length === 1;
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const payload = {
          product_id: productId,
          label: v.label || "Standard",
          code: v.code || null,
          purchase_price: v.purchase_price,
          sale_price: v.sale_price,
          stock: v.stock,
          min_stock: v.min_stock,
          unit: v.unit,
          volume_cl: v.volume_cl,
          photo_url: v.photo_url,
          display_order: i,
          is_default: isSingle,
        };
        if (v.id) {
          const { error } = await supabase
            .from("product_variants")
            .update(payload)
            .eq("id", v.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("product_variants").insert(payload);
          if (error) throw error;
        }
      }

      // Suppression des variantes retirées (en édition)
      if (isEdit && product) {
        const keptIds = variants.filter((v) => v.id).map((v) => v.id);
        const toDelete = product.variants
          .filter((v) => !keptIds.includes(v.id))
          .map((v) => v.id);
        if (toDelete.length > 0) {
          await supabase.from("product_variants").delete().in("id", toDelete);
        }
      }

      toast.success(isEdit ? "Produit mis à jour" : "Produit créé");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Modifier le produit" : "Nouveau produit"}
      maxWidth="max-w-2xl"
    >
      <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        {/* Infos produit */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du produit">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Coca-Cola" />
          </Field>
          <Field label="Catégorie">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Description (optionnelle)">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Pression maison…"
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Ordre d'affichage">
            <Input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </Field>
          <label className="flex items-end gap-2 pb-2.5">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-5 w-5 accent-violet"
            />
            <span className="text-sm text-text-main">Actif (caisse)</span>
          </label>
          <label className="flex items-end gap-2 pb-2.5">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="h-5 w-5 accent-violet"
            />
            <span className="text-sm text-text-main">Visible (menu)</span>
          </label>
        </div>

        {/* Variantes */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide text-violet-light">
              Variantes
            </h3>
            <Button size="sm" variant="secondary" onClick={addVariant}>
              <Plus size={16} className="mr-1 inline" /> Ajouter
            </Button>
          </div>

          <div className="space-y-4">
            {variants.map((v, i) => (
              <div
                key={i}
                className="rounded-xl border border-card-border bg-bg p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-text-muted">
                    Variante {i + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      onClick={() => removeVariant(i)}
                      className="text-text-muted hover:text-stock-out"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Libellé (ex : 33 cl)">
                    <Input
                      value={v.label}
                      onChange={(e) => updateVariant(i, { label: e.target.value })}
                      placeholder="33 cl"
                    />
                  </Field>
                  <Field label="Code / référence">
                    <Input
                      value={v.code}
                      onChange={(e) => updateVariant(i, { code: e.target.value })}
                      placeholder="COCA-33"
                    />
                  </Field>
                  <Field label="Prix d'achat (€)">
                    <Input
                      type="number"
                      step="0.01"
                      value={v.purchase_price}
                      onChange={(e) =>
                        updateVariant(i, { purchase_price: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Prix de vente (€)">
                    <Input
                      type="number"
                      step="0.01"
                      value={v.sale_price}
                      onChange={(e) =>
                        updateVariant(i, { sale_price: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Stock actuel">
                    <Input
                      type="number"
                      value={v.stock}
                      onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Stock minimum (seuil)">
                    <Input
                      type="number"
                      value={v.min_stock}
                      onChange={(e) =>
                        updateVariant(i, { min_stock: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Unité">
                    <Input
                      value={v.unit}
                      onChange={(e) => updateVariant(i, { unit: e.target.value })}
                      placeholder="canette, verre…"
                    />
                  </Field>
                  <Field label="Volume (cl) — pour prévisions">
                    <Input
                      type="number"
                      step="0.1"
                      value={v.volume_cl ?? ""}
                      onChange={(e) =>
                        updateVariant(i, {
                          volume_cl: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="33"
                    />
                  </Field>
                </div>

                {/* Photo */}
                <div className="mt-3 flex items-center gap-3">
                  {v.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.photo_url}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm text-violet-light transition-colors hover:border-violet">
                    <Upload size={16} />
                    {v.photo_url ? "Changer la photo" : "Ajouter une photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadPhoto(i, file);
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
