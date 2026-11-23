import { describe, expect, it } from "vitest";
import { computeBrandBalances } from "../services/balance-calc";
import { buildOrderItems, type PurchasableVariant } from "../services/order-items";

function variant(overrides: Partial<PurchasableVariant> & { productPct?: number | null; brandPct?: number } = {}) {
  const { productPct = null, brandPct = 20, ...rest } = overrides;
  const v: PurchasableVariant = {
    id: 11,
    label: "Large",
    priceCents: null,
    product: {
      id: 3,
      name: "Olive Oil Soap",
      priceCents: 900,
      commissionPct: productPct,
      brandId: 1,
      brand: { commissionPct: brandPct },
    },
    ...rest,
  };
  return v;
}

describe("commission snapshot", () => {
  it("copies the brand commission and product price onto the order item", () => {
    const [item] = buildOrderItems([{ variantId: 11, quantity: 3 }], new Map([[11, variant()]]));
    expect(item).toEqual({
      productId: 3,
      variantId: 11,
      brandId: 1,
      productName: "Olive Oil Soap",
      variantLabel: "Large",
      quantity: 3,
      unitPriceCents: 900,
      commissionPct: 20,
      lineTotalCents: 2700,
    });
  });

  it("uses the product's commission override and the variant's price override", () => {
    const [item] = buildOrderItems(
      [{ variantId: 11, quantity: 1 }],
      new Map([[11, variant({ productPct: 12.5, priceCents: 1200 })]]),
    );
    expect(item?.commissionPct).toBe(12.5);
    expect(item?.unitPriceCents).toBe(1200);
  });

  it("keeps the snapshot when the brand's commission changes later", () => {
    const live = variant({ brandPct: 20 });
    const items = buildOrderItems([{ variantId: 11, quantity: 2 }], new Map([[11, live]]));

    // The brand renegotiates to 30% after the sale.
    live.product.brand.commissionPct = 30;
    live.product.priceCents = 1500;

    expect(items[0]?.commissionPct).toBe(20);
    expect(items[0]?.unitPriceCents).toBe(900);
    const [balance] = computeBrandBalances([{ id: 1, name: "Dar Zeitoun" }], items, []);
    expect(balance?.commissionCents).toBe(360);
  });

  it("fails loudly if a variant wasn't loaded", () => {
    expect(() => buildOrderItems([{ variantId: 99, quantity: 1 }], new Map())).toThrow();
  });
});
