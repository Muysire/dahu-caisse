// ============================================================
// Layout CAISSE — exige d'être connecté (barman ou admin)
// ============================================================
"use client";

import { Toaster } from "@/components/ui/Toast";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function CaisseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard require="auth">
      {children}
      <Toaster />
    </RouteGuard>
  );
}
