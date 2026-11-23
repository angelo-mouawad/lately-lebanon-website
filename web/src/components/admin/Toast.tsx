"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error";

interface ToastValue {
  notify: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastValue>({ notify: () => undefined });

export const useToast = () => useContext(ToastContext);

/** Short confirmations like "Saved" at the bottom of the screen, read out by screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: Tone; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((message: string, tone: Tone = "success") => {
    clearTimeout(timer.current);
    setToast({ message, tone, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), tone === "error" ? 6000 : 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto animate-fade-in border px-4 py-3 text-sm",
              toast.tone === "success" ? "border-ink bg-ink text-paper" : "border-danger bg-danger-soft text-danger",
            )}
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
