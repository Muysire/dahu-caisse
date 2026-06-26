// ============================================================
// Button — bouton réutilisable aux couleurs Dahu
// ============================================================
"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-violet text-white hover:bg-violet-glow shadow-glow border border-violet",
  secondary:
    "bg-card text-violet-light border border-violet hover:bg-violet/20",
  danger: "bg-stock-out text-white hover:brightness-110 border border-stock-out",
  ghost: "bg-transparent text-text-muted hover:text-violet-light",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-6 py-3.5 text-lg",
  xl: "px-8 py-5 text-2xl", // bouton "Valider" géant
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "rounded-lg font-bold uppercase tracking-wide transition-all",
        "disabled:opacity-40 disabled:cursor-not-allowed active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
