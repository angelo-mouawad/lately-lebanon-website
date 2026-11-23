"use client";

import Image from "next/image";
import Link from "next/link";
import { formatUSD, type QuoteResult } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { cn } from "@/lib/cn";
import { removeFromCart, setCartQuantity, type CartLine } from "@/lib/shop-stores";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";

const t = getMessages();

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-8" : "size-11";
  return (
    <div className="inline-flex items-center border border-line-strong" role="group" aria-label={label}>
      <button
        type="button"
        className={cn(box, "flex items-center justify-center hover:bg-sand-deep disabled:opacity-30")}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={t.cart.decrease}
      >
        <MinusIcon className="size-4" />
      </button>
      <span className={cn("min-w-8 text-center text-sm tabular-nums")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={cn(box, "flex items-center justify-center hover:bg-sand-deep disabled:opacity-30")}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={t.cart.increase}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}

/** The list of items in the bag, used in the drawer, the bag page and checkout. */
export function CartLines({
  lines,
  quote,
  compact,
  editable = true,
  onNavigate,
}: {
  lines: CartLine[];
  quote: QuoteResult | null;
  compact?: boolean;
  editable?: boolean;
  onNavigate?: () => void;
}) {
  const byId = new Map(quote?.lines.map((l) => [l.variantId, l]));

  return (
    <ul className="divide-y divide-line">
      {lines.map((line) => {
        const q = byId.get(line.variantId);
        const unavailable = q ? !q.available : false;
        const clamped = q && q.available && q.requestedQuantity > q.stock;
        return (
          <li key={line.variantId} className={cn("flex gap-4", compact ? "py-4" : "py-5")}>
            <Link
              href={`/products/${line.productSlug}`}
              onClick={onNavigate}
              className={cn("relative shrink-0 bg-sand-deep", compact ? "aspect-4/5 w-20" : "aspect-4/5 w-24 sm:w-28")}
            >
              {line.imageUrl && <Image src={line.imageUrl} alt="" fill sizes="112px" className="object-cover" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="label text-muted">{line.brandName}</p>
                  <Link href={`/products/${line.productSlug}`} onClick={onNavigate} className="font-serif text-lg leading-snug hover:underline">
                    {line.productName}
                  </Link>
                  {line.variantLabel && <p className="text-sm text-muted">{line.variantLabel}</p>}
                </div>
                <p className="shrink-0 text-sm tabular-nums">
                  {unavailable ? "" : formatUSD(line.priceCents * line.quantity)}
                </p>
              </div>
              {unavailable && <p className="text-sm text-danger">{t.cart.unavailable}</p>}
              {clamped && <p className="text-sm text-terracotta">{fmt(t.cart.onlyLeft, { count: q.stock })}</p>}
              <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                {editable && !unavailable ? (
                  <QuantityStepper
                    size="sm"
                    value={line.quantity}
                    max={Math.min(20, line.maxQuantity)}
                    onChange={(n) => setCartQuantity(line.variantId, n)}
                    label={`${t.product.quantity}, ${line.productName}`}
                  />
                ) : (
                  <span className="text-sm text-muted tabular-nums">x {line.quantity}</span>
                )}
                {editable && (
                  <button type="button" onClick={() => removeFromCart(line.variantId)} className="text-sm text-muted underline underline-offset-4 hover:text-ink">
                    {t.cart.remove}
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** "You're $12 away from free delivery" with a thin progress line. */
export function FreeDeliveryNote({ quote }: { quote: QuoteResult | null }) {
  if (!quote?.freeDeliveryThresholdCents) return null;
  const spent = quote.subtotalCents - quote.discountCents;
  const left = quote.freeDeliveryThresholdCents - spent;
  const pct = Math.min(100, Math.max(0, (spent / quote.freeDeliveryThresholdCents) * 100));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">{left > 0 ? fmt(t.cart.freeDeliveryProgress, { amount: formatUSD(left) }) : t.cart.freeDeliveryReached}</p>
      <div className="h-px w-full bg-line" aria-hidden>
        <div className="h-px bg-olive transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
