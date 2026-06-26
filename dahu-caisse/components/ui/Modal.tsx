// ============================================================
// Modal — fenêtre centrée avec overlay (variantes, confirmations)
// ============================================================
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full animate-pop rounded-2xl border border-violet/40 bg-card shadow-glow-lg"
        style={{ maxWidth: undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mx-auto w-full ${maxWidth}`}>
          {title && (
            <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
              <h2 className="font-display text-2xl tracking-wide text-violet-light">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-text-muted transition-colors hover:text-violet-light"
                aria-label="Fermer"
              >
                <X size={22} />
              </button>
            </div>
          )}
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
