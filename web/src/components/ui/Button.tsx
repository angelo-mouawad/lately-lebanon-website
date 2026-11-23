import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper border border-ink hover:bg-ink-soft",
  accent: "bg-terracotta text-paper border border-terracotta hover:bg-terracotta-dark hover:border-terracotta-dark",
  secondary: "bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper",
  ghost: "bg-transparent text-ink border border-transparent hover:border-line",
  danger: "bg-transparent text-danger border border-danger hover:bg-danger hover:text-paper",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-sm uppercase tracking-[0.14em]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

export function Button({ variant, size, loading, block, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, cn(block && "w-full", className))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className={cn(loading && "opacity-60")}>{children}</span>
      {loading && (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
          <span className="block h-full w-1/3 animate-[loading-bar_1s_ease-in-out_infinite] bg-current" />
        </span>
      )}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export function ButtonLink({ variant, size, block, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, cn(block && "w-full", className))} {...props} />;
}
