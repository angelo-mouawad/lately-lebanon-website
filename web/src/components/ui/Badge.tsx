import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "olive" | "success" | "danger" | "warning" | "ink";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line-strong text-ink-soft bg-transparent",
  accent: "border-terracotta text-terracotta bg-transparent",
  olive: "border-olive text-olive bg-transparent",
  success: "border-success text-success bg-success-soft",
  danger: "border-danger text-danger bg-danger-soft",
  warning: "border-[#9a7426] text-[#6e5214] bg-warning-soft",
  ink: "border-ink bg-ink text-paper",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("label inline-flex h-6 items-center border px-2 whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}
