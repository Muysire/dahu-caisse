// ============================================================
// Page LOGIN — connexion par email + mot de passe (barman & admin)
// 100% côté client via Supabase Auth. Aucune route serveur.
// Après connexion, on lit le rôle pour rediriger au bon endroit.
// ============================================================
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DahuLogo } from "@/components/shared/DahuLogo";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { asset } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const supabase = createClient();

    // 1) Connexion
    const { data: auth, error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signErr || !auth.user) {
      setLoading(false);
      setError("Email ou mot de passe incorrect.");
      return;
    }

    // 2) Lecture du rôle pour rediriger
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .single();

    // Admin -> back-office, barman (ou inconnu) -> caisse
    const target =
      profile?.role === "admin" ? asset("/admin/") : asset("/caisse/");
    window.location.href = target;
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
          <div className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="prenom@dahu.fr"
                autoComplete="email"
              />
            </Field>
            <Field label="Mot de passe">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="********"
                autoComplete="current-password"
              />
            </Field>
            <Button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full"
              size="lg"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-stock-out/40 bg-stock-out/10 px-3 py-2 text-center text-sm text-stock-out">
              {error}
            </p>
          )}

          <p className="mt-5 text-center text-xs text-text-muted">
            Barmen & admins se connectent ici. Les comptes sont créés par un
            admin dans « Utilisateurs ».
          </p>
        </div>

        <a
          href={asset("/")}
          className="mt-6 text-sm text-text-muted transition-colors hover:text-violet-light"
        >
          ← Voir le menu public
        </a>
      </div>
    </div>
  );
}
