// ============================================================
// RouteGuard — protection des routes CÔTÉ CLIENT
// (remplace le middleware serveur, impossible sur GitHub Pages)
//
// Usage :
//   <RouteGuard require="auth">   -> exige d'être connecté
//   <RouteGuard require="admin">  -> exige le rôle admin
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { asset } from "@/lib/utils";
import { DahuLogo } from "@/components/shared/DahuLogo";

export function RouteGuard({
  require: requirement,
  children,
}: {
  require: "auth" | "admin";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    let active = true;

    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Pas connecté -> page de login
      if (!user) {
        if (active) {
          setStatus("denied");
          window.location.href = asset("/login/");
        }
        return;
      }

      // Vérifie le rôle si la page exige "admin"
      if (requirement === "admin") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, active")
          .eq("id", user.id)
          .single();

        if (!profile || profile.role !== "admin" || !profile.active) {
          if (active) {
            setStatus("denied");
            // un barman est renvoyé vers la caisse
            window.location.href = asset("/caisse/");
          }
          return;
        }
      }

      if (active) setStatus("ok");
    }

    check();
    return () => {
      active = false;
    };
  }, [requirement, router]);

  if (status !== "ok") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <DahuLogo size={70} showText={false} />
        <p className="animate-pulse font-mono text-sm text-text-muted">
          Vérification de l'accès…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
