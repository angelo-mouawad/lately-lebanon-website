import { formatUSD, type PromoType } from "@latelylebanon/shared";

export interface PromoLike {
  code: string;
  type: PromoType;
  value: number;
  minOrderCents: number;
  expiresAt: Date | null;
  usageLimit: number | null;
  timesUsed: number;
  isActive: boolean;
}

export type PromoEvaluation = { ok: true; discountCents: number } | { ok: false; message: string };

/** Checks a promo code against a subtotal and returns the discount it gives. */
export function evaluatePromo(promo: PromoLike | null, subtotalCents: number, now = new Date()): PromoEvaluation {
  if (!promo) return { ok: false, message: "We couldn't find that code." };
  if (!promo.isActive) return { ok: false, message: "This code is no longer active." };
  if (promo.expiresAt && now > promo.expiresAt) return { ok: false, message: "This code has expired." };
  if (promo.usageLimit != null && promo.timesUsed >= promo.usageLimit) {
    return { ok: false, message: "This code has already been used up." };
  }
  if (subtotalCents < promo.minOrderCents) {
    return { ok: false, message: `Spend ${formatUSD(promo.minOrderCents)} or more to use this code.` };
  }
  const raw = promo.type === "PERCENT" ? Math.round((subtotalCents * promo.value) / 100) : promo.value;
  return { ok: true, discountCents: Math.min(raw, subtotalCents) };
}

export interface TotalsInput {
  lines: { unitPriceCents: number; quantity: number }[];
  /** The selected zone's fee, or null when no zone is chosen yet. */
  zoneFeeCents: number | null;
  freeDeliveryThresholdCents: number | null;
  /** undefined when no code was entered, null when the code doesn't exist. */
  promo?: PromoLike | null;
  now?: Date;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  promo: PromoEvaluation | null;
}

/**
 * The single source of truth for what a customer pays.
 * Free delivery applies when the subtotal after discount reaches the threshold.
 */
export function computeTotals(input: TotalsInput): Totals {
  const subtotalCents = input.lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

  const promo = input.promo === undefined ? null : evaluatePromo(input.promo, subtotalCents, input.now);
  const discountCents = promo?.ok ? promo.discountCents : 0;
  const afterDiscount = subtotalCents - discountCents;

  const qualifiesForFree =
    input.freeDeliveryThresholdCents != null && afterDiscount >= input.freeDeliveryThresholdCents;
  const deliveryFeeCents = subtotalCents === 0 || qualifiesForFree ? 0 : (input.zoneFeeCents ?? 0);

  return {
    subtotalCents,
    discountCents,
    deliveryFeeCents,
    totalCents: afterDiscount + deliveryFeeCents,
    promo,
  };
}

export function variantPrice(productPriceCents: number, variantPriceCents: number | null): number {
  return variantPriceCents ?? productPriceCents;
}

export function effectiveCommissionPct(productPct: number | null, brandPct: number): number {
  return productPct ?? brandPct;
}
