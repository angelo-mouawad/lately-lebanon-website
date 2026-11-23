"use client";

import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { CloseIcon } from "./icons";
import { useDialog } from "./use-dialog";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  side?: "left" | "right";
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}

/** A panel that slides in from the side. Keyboard accessible, closes on Escape. */
export function Drawer({ open, onClose, title, side = "right", children, footer, closeLabel = "Close", className }: DrawerProps) {
  const ref = useDialog<HTMLDivElement>(open, onClose);
  const titleId = useId();
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 flex w-full max-w-md flex-col bg-paper focus:outline-none",
          side === "right"
            ? "right-0 animate-slide-in-right border-l border-ink rtl:right-auto rtl:left-0 rtl:animate-slide-in-left"
            : "left-0 animate-slide-in-left border-r border-ink rtl:left-auto rtl:right-0 rtl:animate-slide-in-right",
          className,
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 id={titleId} className="label text-ink">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="-m-2 p-2 hover:text-terracotta" aria-label={closeLabel}>
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-line p-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
