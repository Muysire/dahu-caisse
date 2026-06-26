// ============================================================
// ADMIN — Fournisseurs : CRUD
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import type { Supplier } from "@/types/database";
import { Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("suppliers").select("*").order("name");
    setSuppliers((data as Supplier[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Fournisseur supprimé");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        subtitle="Carnet d'adresses"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} className="mr-1 inline" /> Nouveau
          </Button>
        }
      />

      {loading ? (
        <p className="text-text-muted">Chargement…</p>
      ) : suppliers.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-text-muted">Aucun fournisseur.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-display text-xl tracking-wide text-text-main">
                  {s.name}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(s)}
                    className="text-text-muted hover:text-violet-light"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="text-text-muted hover:text-stock-out"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {s.contact && (
                <p className="mt-1 text-sm text-text-muted">{s.contact}</p>
              )}
              <div className="mt-2 space-y-1 text-sm">
                {s.phone && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Phone size={13} /> {s.phone}
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Mail size={13} /> {s.email}
                  </div>
                )}
              </div>
              {s.notes && (
                <p className="mt-2 rounded-lg bg-bg p-2 text-xs text-text-muted">
                  {s.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SupplierModal
          supplier={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function SupplierModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(supplier?.name ?? "");
  const [contact, setContact] = useState(supplier?.contact ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [notes, setNotes] = useState(supplier?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name,
      contact: contact || null,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    };
    const { error } = supplier
      ? await supabase.from("suppliers").update(payload).eq("id", supplier.id)
      : await supabase.from("suppliers").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(supplier ? "Fournisseur mis à jour" : "Fournisseur créé");
    onSaved();
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={supplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
    >
      <div className="space-y-4">
        <Field label="Nom">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Contact">
          <Input value={contact} onChange={(e) => setContact(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Téléphone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Notes">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={submit} disabled={saving} className="flex-1">
            {saving ? "…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
