// ============================================================
// NumericPad — pavé numérique tactile (connexion barman par PIN)
// ============================================================
"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

export function NumericPad({
  value,
  onChange,
  maxLength = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  const press = (digit: string) => {
    if (value.length < maxLength) onChange(value + digit);
  };
  const backspace = () => onChange(value.slice(0, -1));

  return (
    <div className="select-none">
      {/* Points indiquant la saisie */}
      <div className="mb-6 flex justify-center gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-all",
              i < value.length
                ? "border-violet-light bg-violet-light shadow-glow"
                : "border-card-border"
            )}
          />
        ))}
      </div>

      <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <PadButton key={d} onClick={() => press(d)}>
            {d}
          </PadButton>
        ))}
        <div /> {/* case vide */}
        <PadButton onClick={() => press("0")}>0</PadButton>
        <PadButton onClick={backspace} aria-label="Effacer">
          <Delete className="mx-auto" size={24} />
        </PadButton>
      </div>
    </div>
  );
}

function PadButton({
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-2xl border border-card-border bg-card text-3xl font-bold text-text-main transition-all hover:border-violet active:scale-90 active:bg-violet/20"
      {...props}
    >
      {children}
    </button>
  );
}
