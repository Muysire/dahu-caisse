// ============================================================
// Toast — notifications (confirmation de vente, erreurs)
// Système léger basé sur un store Zustand.
// ============================================================
"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  show: (type: ToastType, message: string) => void;
  remove: (id: number) => void;
}

export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],
  show: (type, message) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { id, type, message }] });
    setTimeout(() => get().remove(id), 3500);
  },
  remove: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Raccourcis pratiques. */
export const toast = {
  success: (m: string) => useToast.getState().show("success", m),
  error: (m: string) => useToast.getState().show("error", m),
};

export function Toaster() {
  const { toasts, remove } = useToast();

  return (
    <div className="fixed bottom-4 left-1/2 z-[3000] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "animate-pop flex items-center gap-3 rounded-xl border px-4 py-3 shadow-glow-lg backdrop-blur",
            t.type === "success"
              ? "border-stock-ok/50 bg-stock-ok/15 text-stock-ok"
              : "border-stock-out/50 bg-stock-out/15 text-stock-out"
          )}
        >
          {t.type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="flex-1 text-sm font-semibold text-text-main">
            {t.message}
          </span>
          <button onClick={() => remove(t.id)} aria-label="Fermer">
            <X size={16} className="text-text-muted" />
          </button>
        </div>
      ))}
    </div>
  );
}
