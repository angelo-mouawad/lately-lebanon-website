import { describe, expect, it } from "vitest";
import { computeTotals } from "../services/pricing";

// Brand 1 has its own delivery at $3 for the chosen area. Brand 2 uses ours, at $4.
const brandFees = new Map([[1, 300]]);

describe("brands with their own delivery service", () => {
  it("charges the brand's fee instead of ours when the brand delivers everything", () => {
    const totals = computeTotals({
      lines: [
        { unitPriceCents: 2000, quantity: 1, brandId: 1 },
        { unitPriceCents: 1500, quantity: 2, brandId: 1 },
      ],
      zoneFeeCents: 400,
      brandFees,
      freeDeliveryThresholdCents: null,
    });
    expect(totals).toMatchObject({
      subtotalCents: 5000,
      shopDelivers: false,
      shopDeliveryFeeCents: 0,
      brandDeliveries: [{ brandId: 1, feeCents: 300 }],
      deliveryFeeCents: 300,
      totalCents: 5300,
    });
  });

  it("charges both fees when the bag mixes a self-delivering brand with ours", () => {
    const totals = computeTotals({
      lines: [
        { unitPriceCents: 2000, quantity: 1, brandId: 1 },
        { unitPriceCents: 1000, quantity: 1, brandId: 2 },
      ],
      zoneFeeCents: 400,
      brandFees,
      freeDeliveryThresholdCents: null,
    });
    expect(totals).toMatchObject({ shopDeliveryFeeCents: 400, deliveryFeeCents: 700, totalCents: 3700 });
  });

  it("charges each self-delivering brand once", () => {
    const totals = computeTotals({
      lines: [
        { unitPriceCents: 1000, quantity: 1, brandId: 1 },
        { unitPriceCents: 1000, quantity: 1, brandId: 3 },
        { unitPriceCents: 1000, quantity: 1, brandId: 1 },
      ],
      zoneFeeCents: 400,
      brandFees: new Map([
        [1, 300],
        [3, 250],
      ]),
      freeDeliveryThresholdCents: null,
    });
    expect(totals.brandDeliveries).toEqual([
      { brandId: 1, feeCents: 300 },
      { brandId: 3, feeCents: 250 },
    ]);
    expect(totals.deliveryFeeCents).toBe(550);
  });

  it("free delivery waives our fee but never the brand's", () => {
    const totals = computeTotals({
      lines: [
        { unitPriceCents: 6000, quantity: 1, brandId: 1 },
        { unitPriceCents: 3000, quantity: 1, brandId: 2 },
      ],
      zoneFeeCents: 400,
      brandFees,
      freeDeliveryThresholdCents: 7500,
    });
    expect(totals).toMatchObject({ shopDelivers: true, shopDeliveryFeeCents: 0, deliveryFeeCents: 300 });
  });

  it("uses our fee for every item when no brand delivers to this area", () => {
    const totals = computeTotals({
      lines: [{ unitPriceCents: 2000, quantity: 1, brandId: 1 }],
      zoneFeeCents: 400,
      brandFees: new Map(),
      freeDeliveryThresholdCents: null,
    });
    expect(totals).toMatchObject({ shopDeliveryFeeCents: 400, brandDeliveries: [], deliveryFeeCents: 400 });
  });

  it("charges no brand fee for items that are out of stock in the bag", () => {
    const totals = computeTotals({
      lines: [
        { unitPriceCents: 2000, quantity: 0, brandId: 1 },
        { unitPriceCents: 1000, quantity: 1, brandId: 2 },
      ],
      zoneFeeCents: 400,
      brandFees,
      freeDeliveryThresholdCents: null,
    });
    expect(totals).toMatchObject({ brandDeliveries: [], deliveryFeeCents: 400 });
  });

  it("charges nothing until an area is chosen", () => {
    const totals = computeTotals({
      lines: [{ unitPriceCents: 2000, quantity: 1, brandId: 1 }],
      zoneFeeCents: null,
      brandFees,
      freeDeliveryThresholdCents: null,
    });
    expect(totals.deliveryFeeCents).toBe(0);
  });
});
