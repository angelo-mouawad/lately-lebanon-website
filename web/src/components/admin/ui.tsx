"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="no-print mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        {back}
        <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** A titled block of a form or page. */
export function Section({
  title,
  description,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-line bg-paper p-5 sm:p-6", className)}>
      {title && (
        <header className="mb-5">
          <h2 className="font-serif text-xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </header>
      )}
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** Technical fields, closed by default so the main screen stays simple. */
export function Advanced({ children, label = "Advanced" }: { children: ReactNode; label?: string }) {
  return (
    <details className="group border border-line bg-paper">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium sm:px-6 [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-5 border-t border-line p-5 sm:p-6">{children}</div>
    </details>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 border border-danger bg-danger-soft p-5 text-sm text-danger">
      <p>{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyBlock({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-line-strong p-8">
      <p className="font-serif text-xl">{title}</p>
      {children}
    </div>
  );
}

export function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span className="text-muted tabular-nums">
        Page {page} of {pageCount}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  );
}

/** Shows the first validation message at the top of a form. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}
