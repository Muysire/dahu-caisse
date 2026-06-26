// ============================================================
// RushHeader — barre supérieure compacte (caisse & admin)
// ============================================================
"use client";

import { DahuLogo } from "./DahuLogo";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export function RushHeader({ right }: { right?: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50">
      <div className="dahu-banner" />
      <div className="flex items-center justify-between border-b border-card-border bg-bg/95 px-4 py-2.5 backdrop-blur">
        <DahuLogo size={40} />
        <div className="flex items-center gap-3">
          {right}
          {profile && (
            <span className="hidden text-sm text-text-muted sm:inline">
              {profile.username}
              <span className="ml-1.5 rounded bg-violet/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-light">
                {profile.role}
              </span>
            </span>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-violet hover:text-violet-light"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
