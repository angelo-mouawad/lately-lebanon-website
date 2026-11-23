"use client";

import { useState } from "react";
import { formatUSD, type QuoteResult } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { promoStore, usePromo } from "@/lib/shop-stores";
import { Skeleton } from "@/components/ui/Skeleton";

const t = getMessages();

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex items-baseline justify-between border-t border-ink pt-4 text-lg" : "flex items-baseline justify-between text-[15px]"}>
      <dt className={strong ? "font-medium" : "text-ink-soft"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/** Subtotal, discount, delivery and total as calculated by the API. */
export function Totals({ quote, zoneChosen }: { quote: QuoteResult | null; zoneChosen: boolean }) {
  if (!quote) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-7 w-full" />
      </div>
    );
  }
  const reachedFree =
    quote.freeDeliveryThresholdCents != null && quote.subtotalCents - quote.discountCents >= quote.freeDeliveryThresholdCents;
  const delivery =
    quote.deliveryFeeCents > 0
      ? formatUSD(quote.deliveryFeeCents)
      : reachedFree || zoneChosen
        ? t.common.free
        : t.cart.deliveryAtCheckout;
  return (
    <dl className="flex flex-col gap-3">
      <Row label={t.cart.subtotal} value={formatUSD(quote.subtotalCents)} />
      {quote.discountCents > 0 && <Row label={t.cart.discount} value={`-${formatUSD(quote.discountCents)}`} />}
      <Row label={t.cart.delivery} value={delivery} />
      <Row label={t.cart.total} value={formatUSD(quote.totalCents)} strong />
    </dl>
  );
}

/** Promo code entry. The code is saved so it carries over from the bag to checkout. */
export function PromoField({ quote, error }: { quote: QuoteResult | null; error?: string }) {
  const code = usePromo();
  const [text, setText] = useState("");

  function apply() {
    if (!text.trim()) return;
    promoStore.set(text.trim().toUpperCase());
    setText("");
  }

  if (code) {
    const message = error ?? quote?.promo?.message;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>
            {quote?.promo?.applied ? fmt(t.cart.promoApplied, { code }) : <span className="font-medium">{code}</span>}
          </span>
          <button type="button" onClick={() => promoStore.set("")} className="underline underline-offset-4">
            {t.cart.promoRemove}
          </button>
        </div>
        {message && (
          <p role="alert" className="text-sm text-danger">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    // Not a <form>: this sits inside the checkout form, and forms can't be nested.
    <div className="flex gap-2" role="group" aria-label={t.cart.promoLabel}>
      <label htmlFor="promo" className="sr-only">
        {t.cart.promoLabel}
      </label>
      <input
        id="promo"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
        placeholder={t.cart.promoLabel}
        autoCapitalize="characters"
        className="h-11 w-full border border-line-strong bg-paper px-3 text-sm uppercase placeholder:normal-case focus:border-ink focus:outline-none"
      />
      <button type="button" onClick={apply} disabled={!text.trim()} className="h-11 shrink-0 border border-ink px-4 text-sm hover:bg-ink hover:text-paper disabled:opacity-40">
        {t.cart.promoApply}
      </button>
    </div>
  );
}
