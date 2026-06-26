// ============================================================
// Card — conteneur sombre bordé (style site vitrine)
// ============================================================
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-card border border-card-border rounded-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
