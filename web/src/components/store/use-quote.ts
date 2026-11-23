"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuoteResult } from "@latelylebanon/shared";
import { quoteCart } from "@/lib/public-api";
import { cartStore, useCart } from "@/lib/shop-stores";

/**
 * Prices the bag with the API so totals, stock and promo codes are always current.
 * When the API reports a new price or less stock, the saved bag is updated to match.
 */
export function useQuote({ zoneId, promoCode, enabled = true }: { zoneId?: number | null; promoCode?: string | null; enabled?: boolean } = {}) {
  const lines = useCart();
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const key = useMemo(() => JSON.stringify(lines.map((l) => [l.variantId, l.quantity])), [lines]);

  useEffect(() => {
    if (!enabled) return;
    const items = JSON.parse(key) as [number, number][];
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      quoteCart({ items: items.map(([variantId, quantity]) => ({ variantId, quantity })), zoneId, promoCode }, controller.signal)
        .then((result) => {
          setQuote(result);
          setFailed(false);
          reconcile(result);
        })
        .catch((err: unknown) => {
          if ((err as Error).name !== "AbortError") setFailed(true);
        })
        .finally(() => setLoading(false));
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, zoneId, promoCode, enabled]);

  return { lines, quote, loading, failed };
}

function reconcile(quote: QuoteResult) {
  const byId = new Map(quote.lines.map((l) => [l.variantId, l]));
  const current = cartStore.get();
  let changed = false;
  const next = current.flatMap((line) => {
    const q = byId.get(line.variantId);
    if (!q) {
      changed = true;
      return [];
    }
    const quantity = q.available ? Math.min(line.quantity, q.stock) : line.quantity;
    const updated = {
      ...line,
      quantity,
      priceCents: q.unitPriceCents,
      maxQuantity: q.available ? q.stock : line.maxQuantity,
      productName: q.productName,
      imageUrl: q.image?.sm ?? line.imageUrl,
    };
    if (updated.quantity !== line.quantity || updated.priceCents !== line.priceCents || updated.maxQuantity !== line.maxQuantity) {
      changed = true;
    }
    return [updated];
  });
  if (changed) cartStore.set(next);
}
