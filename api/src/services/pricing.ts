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
  lines: { unitPriceCents: number; quantity: number; brandId?: number }[];
  /** The selected zone's fee, or null when no zone is chosen yet. */
  zoneFeeCents: number | null;
  /**
   * Brand id to that brand's own fee for the selected zone. Only brands with their own
   * delivery switched on and a price for this zone. Everyone else is delivered by us.
   */
  brandFees?: Map<number, number>;
  freeDeliveryThresholdCents: number | null;
  /** undefined when no code was entered, null when the code doesn't exist. */
  promo?: PromoLike | null;
  now?: Date;
}

export interface BrandDeliveryCharge {
  brandId: number;
  feeCents: number;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  /** Everything the customer pays for delivery: our fee plus every brand's fee. */
  deliveryFeeCents: number;
  /** True when at least one item is delivered by us. */
  shopDelivers: boolean;
  /** Our part of the delivery fee, for the items we deliver. 0 when free or nothing to deliver. */
  shopDeliveryFeeCents: number;
  /** Brands that deliver their own items on this order, and what each charges. */
  brandDeliveries: BrandDeliveryCharge[];
  totalCents: number;
  promo: PromoEvaluation | null;
}

/**
 * Splits delivery between us and brands with their own delivery service.
 * - Each brand in `brandFees` delivers its own items and charges its fee once.
 * - We deliver everything else and charge the zone fee once, unless the order
 *   qualifies for free delivery. Free delivery never waives a brand's fee.
 */
function splitDelivery(input: TotalsInput, qualifiesForFree: boolean) {
  const lines = input.lines.filter((l) => l.quantity > 0);
  if (input.zoneFeeCents == null || lines.length === 0) {
    return { shopDelivers: false, shopDeliveryFeeCents: 0, brandDeliveries: [] as BrandDeliveryCharge[] };
  }
  const brandFees = input.brandFees ?? new Map<number, number>();
  const brandDeliveries: BrandDeliveryCharge[] = [];
  let shopDelivers = false;
  for (const l of lines) {
    const fee = l.brandId == null ? undefined : brandFees.get(l.brandId);
    if (fee === undefined) shopDelivers = true;
    else if (!brandDeliveries.some((d) => d.brandId === l.brandId)) brandDeliveries.push({ brandId: l.brandId!, feeCents: fee });
  }
  return { shopDelivers, shopDeliveryFeeCents: shopDelivers && !qualifiesForFree ? input.zoneFeeCents : 0, brandDeliveries };
}

/**
 * The single source of truth for what a customer pays.
 * Free delivery applies to our delivery when the subtotal after discount reaches the threshold.
 */
export function computeTotals(input: TotalsInput): Totals {
  const subtotalCents = input.lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

  const promo = input.promo === undefined ? null : evaluatePromo(input.promo, subtotalCents, input.now);
  const discountCents = promo?.ok ? promo.discountCents : 0;
  const afterDiscount = subtotalCents - discountCents;

  const qualifiesForFree =
    input.freeDeliveryThresholdCents != null && afterDiscount >= input.freeDeliveryThresholdCents;
  const { shopDelivers, shopDeliveryFeeCents, brandDeliveries } = splitDelivery(input, qualifiesForFree);
  const deliveryFeeCents = brandDeliveries.reduce((sum, d) => sum + d.feeCents, shopDeliveryFeeCents);

  return {
    subtotalCents,
    discountCents,
    deliveryFeeCents,
    shopDelivers,
    shopDeliveryFeeCents,
    brandDeliveries,
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
