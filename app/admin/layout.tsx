// ============================================================
// Layout ADMIN — sidebar + garde de rôle (le middleware protège déjà)
// ============================================================
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Toaster } from "@/components/ui/Toast";
import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double sécurité (en plus du middleware)
  if (!(await isAdmin())) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
