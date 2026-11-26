import { describe, expect, it } from "vitest";
import { computeBrandBalances } from "../services/balance-calc";

const brands = [
  { id: 1, name: "Dar Zeitoun" },
  { id: 2, name: "Qamar Ceramics" },
  { id: 3, name: "Nawl Studio" },
];

describe("brand balance calculation", () => {
  it("works out sales, commission, amount owed, payouts and balance per brand", () => {
    const balances = computeBrandBalances(
      brands,
      [
        { brandId: 1, lineTotalCents: 10000, commissionPct: 20 },
        { brandId: 1, lineTotalCents: 5000, commissionPct: 25 },
        { brandId: 2, lineTotalCents: 8000, commissionPct: 15 },
      ],
      [
        { brandId: 1, amountCents: 6000 },
        { brandId: 2, amountCents: 6800 },
      ],
    );

    expect(balances[0]).toEqual({
      brandId: 1,
      brandName: "Dar Zeitoun",
      totalSalesCents: 15000,
      commissionCents: 3250,
      deliveryFeesCents: 0,
      owedToBrandCents: 11750,
      paidOutCents: 6000,
      balanceCents: 5750,
    });
    expect(balances[1]).toMatchObject({ commissionCents: 1200, owedToBrandCents: 6800, balanceCents: 0 });
  });

  it("shows brands with no sales at zero", () => {
    const balances = computeBrandBalances(brands, [], []);
    expect(balances[2]).toEqual({
      brandId: 3,
      brandName: "Nawl Studio",
      totalSalesCents: 0,
      commissionCents: 0,
      deliveryFeesCents: 0,
      owedToBrandCents: 0,
      paidOutCents: 0,
      balanceCents: 0,
    });
  });

  it("goes negative when a brand was paid in advance", () => {
    const [balance] = computeBrandBalances([brands[0]!], [], [{ brandId: 1, amountCents: 2000 }]);
    expect(balance?.balanceCents).toBe(-2000);
  });

  it("rounds commission per line to the cent", () => {
    const [balance] = computeBrandBalances(
      [brands[0]!],
      [
        { brandId: 1, lineTotalCents: 333, commissionPct: 15 },
        { brandId: 1, lineTotalCents: 333, commissionPct: 15 },
      ],
      [],
    );
    // 49.95 rounds to 50 on each line.
    expect(balance?.commissionCents).toBe(100);
    expect(balance?.owedToBrandCents).toBe(566);
  });

  it("ignores sales and payouts for unknown brands", () => {
    const balances = computeBrandBalances(
      [brands[0]!],
      [{ brandId: 42, lineTotalCents: 1000, commissionPct: 20 }],
      [{ brandId: 42, amountCents: 500 }],
    );
    expect(balances).toHaveLength(1);
    expect(balances[0]?.totalSalesCents).toBe(0);
  });

  it("adds a brand's own delivery fees to what we owe it, with no commission", () => {
    const [balance] = computeBrandBalances(
      [brands[0]!],
      [{ brandId: 1, lineTotalCents: 10000, commissionPct: 20 }],
      [{ brandId: 1, amountCents: 5000 }],
      [
        { brandId: 1, feeCents: 300 },
        { brandId: 1, feeCents: 500 },
        { brandId: 42, feeCents: 900 },
      ],
    );
    expect(balance).toMatchObject({
      totalSalesCents: 10000,
      commissionCents: 2000,
      deliveryFeesCents: 800,
      owedToBrandCents: 8800,
      balanceCents: 3800,
    });
  });
});
