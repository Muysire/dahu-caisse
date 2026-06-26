// ============================================================
// ADMIN — Utilisateurs : liste + création (barman / admin)
// 100% COTE CLIENT, sans service_role.
//
// Astuce cle : pour creer un compte SANS deconnecter l'admin courant,
// on instancie un client Supabase SECONDAIRE et ISOLE
// (persistSession:false) dedie au signUp. La session de l'admin,
// stockee par le client principal, n'est pas touchee.
//
// Le profil (role) est cree par un TRIGGER en base (voir database/
// functions.sql -> handle_new_user), a partir des metadonnees passees
// au signUp. Aucune ecriture directe dans "profiles" n'est necessaire.
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { createClient as createIsolatedClient } from "@supabase/supabase-js";
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

  // Desactivation (on ne peut pas supprimer un compte Auth sans service_role,
  // mais on peut le rendre inactif : il ne pourra plus rien faire via la RLS).
  const deactivate = async (u: Profile) => {
    if (
      !confirm(
        `Desactiver ${u.username} ? Il ne pourra plus se connecter ni agir.`
      )
    )
      return;
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ active: false })
      .eq("id", u.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Utilisateur desactive");
    load();
  };

  const reactivate = async (u: Profile) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ active: true })
      .eq("id", u.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Utilisateur reactive");
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
        <p className="text-text-muted">Chargement...</p>
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
                {u.active ? (
                  <button
                    onClick={() => deactivate(u)}
                    title="Desactiver"
                    className="text-text-muted hover:text-stock-out"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => reactivate(u)}
                    className="text-xs font-bold text-violet-light hover:underline"
                  >
                    Reactiver
                  </button>
                )}
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
                Cree le {formatDate(u.created_at)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <CreateUserModal onClose={() => setCreating(false)} onSaved={load} />
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!username.trim() || !email.trim() || password.length < 6) {
      toast.error("Nom, email et mot de passe (6+ caracteres) requis.");
      return;
    }
    setSaving(true);

    // Client ISOLE : ne touche pas la session de l'admin connecte
    const isolated = createIsolatedClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Le role + le username voyagent dans les metadonnees ; un trigger en base
    // cree la ligne "profiles" correspondante automatiquement.
    const { error } = await isolated.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim(), role },
      },
    });

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      `Compte cree pour ${username}. Il peut se connecter avec son email + mot de passe.`
    );
    onSaved();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Nouvel utilisateur" maxWidth="max-w-sm">
      <div className="space-y-4">
        {/* Choix du role */}
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
              {r === "barman" ? "Barman" : "Admin"}
            </button>
          ))}
        </div>

        <Field label="Nom d'utilisateur (affiche)">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ex : Leo"
          />
        </Field>

        <Field label="Email de connexion">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="leo@dahu.fr"
          />
        </Field>

        <Field label="Mot de passe (6+ caracteres)">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <p className="rounded-lg bg-bg p-3 text-xs text-text-muted">
          {role === "barman"
            ? "Le barman se connectera avec cet email et ce mot de passe. Il n'aura acces qu'a la caisse."
            : "L'admin aura acces a tout le back-office."}{" "}
          Transmets-lui ses identifiants.
        </p>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={submit} disabled={saving} className="flex-1">
            {saving ? "Creation..." : "Creer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
