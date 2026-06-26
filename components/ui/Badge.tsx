// ============================================================
// Badge — pastille de statut (stock, état...)
// ============================================================
import { cn } from "@/lib/utils";
import { stockStatusClasses } from "@/lib/utils";
import type { StockStatus } from "@/types/database";

export function StockBadge({
  status,
  children,
}: {
  status: StockStatus;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold font-mono",
        stockStatusClasses(status)
      )}
    >
      {children}
    </span>
  );
}

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-violet/40 bg-violet/10 px-2 py-0.5 text-xs font-bold text-violet-light",
        className
      )}
    >
      {children}
    </span>
  );
}
