// ============================================================
// Page LOGIN — onglet Admin (email + mot de passe) / Barman (PIN)
// ============================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DahuLogo } from "@/components/shared/DahuLogo";
import { NumericPad } from "@/components/ui/NumericPad";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Tab = "barman" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("barman");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Barman
  const [pin, setPin] = useState("");

  // Connexion admin (email + mot de passe)
  const handleAdminLogin = async () => {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Identifiant ou mot de passe incorrect.");
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  // Connexion barman (PIN) — passe par l'API serveur
  const handlePinSubmit = async (value: string) => {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: value }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json();
      setError(error ?? "PIN incorrect.");
      setPin("");
      return;
    }
    router.push("/caisse");
    router.refresh();
  };

  // Soumet automatiquement quand le PIN atteint 4 chiffres
  const onPinChange = (value: string) => {
    setPin(value);
    setError(null);
    if (value.length === 4) handlePinSubmit(value);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="dahu-banner" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <DahuLogo size={90} showText={false} className="mb-4 justify-center" />
        <h1 className="font-display text-4xl tracking-widest text-violet-light">
          DAHU CAISSE
        </h1>
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          One Love · One Sound · One Vibe
        </p>

        <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card p-6 shadow-card">
          {/* Onglets */}
          <div className="mb-6 flex rounded-lg border border-card-border p-1">
            {(["barman", "admin"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError(null);
                }}
                className={cn(
                  "flex-1 rounded-md py-2 text-sm font-bold uppercase tracking-wide transition-colors",
                  tab === t
                    ? "bg-violet text-white"
                    : "text-text-muted hover:text-violet-light"
                )}
              >
                {t === "barman" ? "🍺 Barman" : "🔧 Admin"}
              </button>
            ))}
          </div>

          {/* Contenu Barman : PIN */}
          {tab === "barman" && (
            <div>
              <p className="mb-6 text-center text-sm text-text-muted">
                Saisis ton code à 4 chiffres
              </p>
              <NumericPad value={pin} onChange={onPinChange} />
              {loading && (
                <p className="mt-4 text-center text-sm text-violet-light">
                  Connexion…
                </p>
              )}
            </div>
          )}

          {/* Contenu Admin : email + mot de passe */}
          {tab === "admin" && (
            <div className="space-y-4">
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dahu.fr"
                  autoComplete="email"
                />
              </Field>
              <Field label="Mot de passe">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
              <Button
                onClick={handleAdminLogin}
                disabled={loading || !email || !password}
                className="w-full"
                size="lg"
              >
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-stock-out/40 bg-stock-out/10 px-3 py-2 text-center text-sm text-stock-out">
              {error}
            </p>
          )}
        </div>

        <a
          href="/"
          className="mt-6 text-sm text-text-muted transition-colors hover:text-violet-light"
        >
          ← Voir le menu public
        </a>
      </div>
    </div>
  );
}
