// ============================================================
// CategoryTabs — onglets de catégories scrollables (caisse)
// ============================================================
"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  slug: string;
  name: string;
  icon: string;
}

export function CategoryTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: TabItem[];
  active: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <TabButton
        label="Tout"
        icon="🔊"
        isActive={active === "all"}
        onClick={() => onSelect("all")}
      />
      {tabs.map((t) => (
        <TabButton
          key={t.slug}
          label={t.name}
          icon={t.icon}
          isActive={active === t.slug}
          onClick={() => onSelect(t.slug)}
        />
      ))}
    </div>
  );
}

function TabButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-all active:scale-95",
        isActive
          ? "border-violet bg-violet text-white shadow-glow"
          : "border-card-border bg-card text-text-muted hover:border-violet hover:text-violet-light"
      )}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
