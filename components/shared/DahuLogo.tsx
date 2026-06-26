// ============================================================
// DahuLogo — logo + wordmark (reprend le hero du site vitrine)
// ============================================================
import Image from "next/image";
import { cn } from "@/lib/utils";

export function DahuLogo({
  size = 64,
  showText = true,
  className,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/images/logo-dahu-white.png"
        alt="Logo Dahu Sound System"
        width={size}
        height={size}
        className="logo-glow"
        priority
      />
      {showText && (
        <div className="leading-none">
          <div className="font-display text-2xl tracking-widest text-violet-light">
            DAHU
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
            Sound System
          </div>
        </div>
      )}
    </div>
  );
}
