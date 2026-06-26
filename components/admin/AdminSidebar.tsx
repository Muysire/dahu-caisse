// ============================================================
// AdminSidebar — navigation admin (sidebar desktop / menu mobile)
// ============================================================
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DahuLogo } from "@/components/shared/DahuLogo";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Boxes,
  TrendingUp,
  ShoppingBag,
  Truck,
  History,
  BarChart3,
  Download,
  Users,
  ShoppingCart,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/stock", label: "Stock", icon: Boxes },
  { href: "/admin/previsions", label: "Prévisions", icon: TrendingUp },
  { href: "/admin/achats", label: "Achats", icon: ShoppingBag },
  { href: "/admin/fournisseurs", label: "Fournisseurs", icon: Truck },
  { href: "/admin/historique", label: "Historique", icon: History },
  { href: "/admin/stats", label: "Statistiques", icon: BarChart3 },
  { href: "/admin/exports", label: "Exports CSV", icon: Download },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {LINKS.map((link) => {
        const Icon = link.icon;
        const active =
          pathname === link.href ||
          (link.href !== "/admin" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-violet text-white shadow-glow"
                : "text-text-muted hover:bg-card hover:text-violet-light"
            )}
          >
            <Icon size={18} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-card-border p-3">
      <Link
        href="/caisse"
        className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-violet-light transition-colors hover:bg-card"
      >
        <ShoppingCart size={18} />
        Ouvrir la caisse
      </Link>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="truncate text-xs text-text-muted">
          {profile?.username}
        </span>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-stock-out"
        >
          <LogOut size={14} />
          Sortir
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Barre mobile */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-card-border bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <DahuLogo size={36} />
        <button onClick={() => setOpen(true)} aria-label="Menu">
          <Menu size={26} className="text-violet-light" />
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-card-border bg-bg lg:flex">
        <div className="border-b border-card-border p-4">
          <DahuLogo size={40} />
        </div>
        {nav}
        {footer}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
          <div className="flex w-64 flex-col border-l border-card-border bg-bg">
            <div className="flex items-center justify-between border-b border-card-border p-4">
              <DahuLogo size={36} />
              <button onClick={() => setOpen(false)} aria-label="Fermer">
                <X size={24} className="text-text-muted" />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
