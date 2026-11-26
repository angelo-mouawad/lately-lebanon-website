import { percentOf, type BrandBalance } from "@latelylebanon/shared";

export interface SaleLine {
  brandId: number;
  lineTotalCents: number;
  /** The commission copied onto the order item at purchase time. */
  commissionPct: number;
}

/** A delivery fee a brand charged for delivering its own items. */
export interface DeliveryLine {
  brandId: number;
  feeCents: number;
}

export interface PayoutLine {
  brandId: number;
  amountCents: number;
}

/**
 * Per brand: what was sold, what we keep, what we owe, what we've paid, and what's left.
 * Only pass in items and delivery fees from orders that count as sales (delivered orders).
 * A brand's own delivery fees are owed to it in full, with no commission taken.
 */
export function computeBrandBalances(
  brands: { id: number; name: string }[],
  sales: SaleLine[],
  payouts: PayoutLine[],
  deliveries: DeliveryLine[] = [],
): BrandBalance[] {
  const totals = new Map(brands.map((b) => [b.id, { sales: 0, commission: 0, delivery: 0, paid: 0 }]));

  for (const s of sales) {
    const t = totals.get(s.brandId);
    if (!t) continue;
    t.sales += s.lineTotalCents;
    t.commission += percentOf(s.lineTotalCents, s.commissionPct);
  }
  for (const d of deliveries) {
    const t = totals.get(d.brandId);
    if (t) t.delivery += d.feeCents;
  }
  for (const p of payouts) {
    const t = totals.get(p.brandId);
    if (t) t.paid += p.amountCents;
  }

  return brands.map((b) => {
    const t = totals.get(b.id)!;
    const owed = t.sales - t.commission + t.delivery;
    return {
      brandId: b.id,
      brandName: b.name,
      totalSalesCents: t.sales,
      commissionCents: t.commission,
      deliveryFeesCents: t.delivery,
      owedToBrandCents: owed,
      paidOutCents: t.paid,
      balanceCents: owed - t.paid,
    };
  });
}
