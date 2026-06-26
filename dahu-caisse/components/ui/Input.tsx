// ============================================================
// Input + Select — champs de formulaire stylés Dahu
// ============================================================
"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

const base =
  "w-full rounded-lg bg-bg border border-card-border px-3 py-2.5 text-text-main " +
  "placeholder:text-text-muted focus:border-violet focus:outline-none focus:ring-1 focus:ring-violet transition-colors";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(base, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
