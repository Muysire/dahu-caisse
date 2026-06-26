// ============================================================
// Layout ADMIN — sidebar + garde de rôle CÔTÉ CLIENT
// ============================================================
"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Toaster } from "@/components/ui/Toast";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard require="admin">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
        <Toaster />
      </div>
    </RouteGuard>
  );
}
