import { percentOf, type BrandBalance } from "@latelylebanon/shared";

export interface SaleLine {
  brandId: number;
  lineTotalCents: number;
  /** The commission copied onto the order item at purchase time. */
  commissionPct: number;
}

export interface PayoutLine {
  brandId: number;
  amountCents: number;
}

/**
 * Per brand: what was sold, what we keep, what we owe, what we've paid, and what's left.
 * Only pass in items from orders that count as sales (delivered orders).
 */
export function computeBrandBalances(
  brands: { id: number; name: string }[],
  sales: SaleLine[],
  payouts: PayoutLine[],
): BrandBalance[] {
  const totals = new Map(brands.map((b) => [b.id, { sales: 0, commission: 0, paid: 0 }]));

  for (const s of sales) {
    const t = totals.get(s.brandId);
    if (!t) continue;
    t.sales += s.lineTotalCents;
    t.commission += percentOf(s.lineTotalCents, s.commissionPct);
  }
  for (const p of payouts) {
    const t = totals.get(p.brandId);
    if (t) t.paid += p.amountCents;
  }

  return brands.map((b) => {
    const t = totals.get(b.id)!;
    const owed = t.sales - t.commission;
    return {
      brandId: b.id,
      brandName: b.name,
      totalSalesCents: t.sales,
      commissionCents: t.commission,
      owedToBrandCents: owed,
      paidOutCents: t.paid,
      balanceCents: owed - t.paid,
    };
  });
}
