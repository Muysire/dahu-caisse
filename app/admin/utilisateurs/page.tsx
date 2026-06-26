// ============================================================
// ADMIN — Utilisateurs : liste + création barman (PIN) / admin
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { formatDate, cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { Plus, Trash2, ShieldCheck, Beer } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (u: Profile) => {
    if (!confirm(`Supprimer ${u.username} ? Cette action est définitive.`)) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "Suppression impossible");
      return;
    }
    toast.success("Utilisateur supprimé");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Admins & barmen"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} className="mr-1 inline" /> Nouvel utilisateur
          </Button>
        }
      />

      {loading ? (
        <p className="text-text-muted">Chargement…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {u.role === "admin" ? (
                    <ShieldCheck size={20} className="text-violet-light" />
                  ) : (
                    <Beer size={20} className="text-violet-light" />
                  )}
                  <span className="font-display text-xl tracking-wide text-text-main">
                    {u.username}
                  </span>
                </div>
                <button
                  onClick={() => remove(u)}
                  className="text-text-muted hover:text-stock-out"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge>{u.role === "admin" ? "Administrateur" : "Barman"}</Badge>
                {!u.active && (
                  <Badge className="border-stock-out/40 bg-stock-out/10 text-stock-out">
                    Inactif
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Créé le {formatDate(u.created_at)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function CreateUserModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<"barman" | "admin">("barman");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const body =
      role === "barman"
        ? { role, username, pin }
        : { role, username, email, password };

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "Création impossible");
      return;
    }
    toast.success("Utilisateur créé");
    onSaved();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Nouvel utilisateur" maxWidth="max-w-sm">
      <div className="space-y-4">
        {/* Choix du rôle */}
        <div className="flex rounded-lg border border-card-border p-1">
          {(["barman", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-bold uppercase tracking-wide transition-colors",
                role === r
                  ? "bg-violet text-white"
                  : "text-text-muted hover:text-violet-light"
              )}
            >
              {r === "barman" ? "🍺 Barman" : "🔧 Admin"}
            </button>
          ))}
        </div>

        <Field label="Nom d'utilisateur">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            placeholder={role === "barman" ? "ex : leo" : "ex : theo"}
          />
        </Field>

        {role === "barman" ? (
          <Field label="Code PIN (4 chiffres)">
            <Input
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="0000"
            />
          </Field>
        ) : (
          <>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dahu.fr"
              />
            </Field>
            <Field label="Mot de passe (6+ caractères)">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </>
        )}

        {role === "barman" && (
          <p className="rounded-lg bg-bg p-3 text-xs text-text-muted">
            Le barman se connectera uniquement avec ce code PIN. Note-le : il
            n'est pas récupérable ensuite (mais tu peux recréer le compte).
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={submit} disabled={saving} className="flex-1">
            {saving ? "Création…" : "Créer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
