import { describe, expect, it } from "vitest";
import { computeTotals, type PromoLike } from "../services/pricing";

const promo = (overrides: Partial<PromoLike> = {}): PromoLike => ({
  code: "WELCOME10",
  type: "PERCENT",
  value: 10,
  minOrderCents: 0,
  expiresAt: null,
  usageLimit: null,
  timesUsed: 0,
  isActive: true,
  ...overrides,
});

describe("checkout total calculation", () => {
  it("adds line totals and the zone's delivery fee", () => {
    const totals = computeTotals({
      lines: [
        { unitPriceCents: 1800, quantity: 2 },
        { unitPriceCents: 4500, quantity: 1 },
      ],
      zoneFeeCents: 400,
      freeDeliveryThresholdCents: null,
    });
    expect(totals).toMatchObject({ subtotalCents: 8100, discountCents: 0, deliveryFeeCents: 400, totalCents: 8500 });
  });

  it("makes delivery free at or above the threshold", () => {
    const totals = computeTotals({
      lines: [{ unitPriceCents: 7500, quantity: 1 }],
      zoneFeeCents: 400,
      freeDeliveryThresholdCents: 7500,
    });
    expect(totals.deliveryFeeCents).toBe(0);
    expect(totals.totalCents).toBe(7500);
  });

  it("charges delivery just below the threshold", () => {
    const totals = computeTotals({
      lines: [{ unitPriceCents: 7499, quantity: 1 }],
      zoneFeeCents: 400,
      freeDeliveryThresholdCents: 7500,
    });
    expect(totals.deliveryFeeCents).toBe(400);
  });

  it("checks the free delivery threshold after the discount", () => {
    const totals = computeTotals({
      lines: [{ unitPriceCents: 8000, quantity: 1 }],
      zoneFeeCents: 500,
      freeDeliveryThresholdCents: 7500,
      promo: promo({ value: 10 }),
    });
    // 80 - 8 = 72, below 75, so delivery is charged.
    expect(totals).toMatchObject({ subtotalCents: 8000, discountCents: 800, deliveryFeeCents: 500, totalCents: 7700 });
  });

  it("has no delivery fee when no zone is chosen yet", () => {
    const totals = computeTotals({
      lines: [{ unitPriceCents: 1000, quantity: 1 }],
      zoneFeeCents: null,
      freeDeliveryThresholdCents: null,
    });
    expect(totals.deliveryFeeCents).toBe(0);
  });

  it("has nothing to pay for an empty cart", () => {
    const totals = computeTotals({ lines: [], zoneFeeCents: 400, freeDeliveryThresholdCents: null });
    expect(totals.totalCents).toBe(0);
  });

  it("ignores an invalid promo code and reports why", () => {
    const totals = computeTotals({
      lines: [{ unitPriceCents: 2000, quantity: 1 }],
      zoneFeeCents: 300,
      freeDeliveryThresholdCents: null,
      promo: null,
    });
    expect(totals.discountCents).toBe(0);
    expect(totals.totalCents).toBe(2300);
    expect(totals.promo).toEqual({ ok: false, message: "We couldn't find that code." });
  });
});
