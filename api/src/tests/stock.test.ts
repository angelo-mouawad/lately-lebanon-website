import { describe, expect, it } from "vitest";
import { decrementStock, mergeLines, OutOfStockError, releaseStock, type StockTx } from "../services/stock";

/**
 * An in-memory stand-in for the Prisma transaction. It applies the same conditional
 * update the database does: decrement only where stock >= quantity.
 */
function fakeTx(initial: Record<number, number>) {
  const stock = new Map(Object.entries(initial).map(([id, qty]) => [Number(id), qty]));
  const tx: StockTx = {
    productVariant: {
      async updateMany({ where, data }) {
        const current = stock.get(where.id);
        if (current === undefined) return { count: 0 };
        if (where.stock && current < where.stock.gte) return { count: 0 };
        const delta = "decrement" in data.stock ? -data.stock.decrement : data.stock.increment;
        stock.set(where.id, current + delta);
        return { count: 1 };
      },
    },
  };
  return { tx, stock };
}

describe("stock decrement", () => {
  it("decrements each variant by the ordered quantity", async () => {
    const { tx, stock } = fakeTx({ 1: 5, 2: 3 });
    await decrementStock(tx, [
      { variantId: 1, quantity: 2 },
      { variantId: 2, quantity: 3 },
    ]);
    expect(stock.get(1)).toBe(3);
    expect(stock.get(2)).toBe(0);
  });

  it("merges repeated lines before checking stock", async () => {
    const { tx, stock } = fakeTx({ 1: 3 });
    await expect(
      decrementStock(tx, [
        { variantId: 1, quantity: 2 },
        { variantId: 1, quantity: 2 },
      ]),
    ).rejects.toBeInstanceOf(OutOfStockError);
    expect(stock.get(1)).toBe(3);
  });

  it("reports every variant that ran out", async () => {
    const { tx } = fakeTx({ 1: 1, 2: 0, 3: 10 });
    const error = await decrementStock(tx, [
      { variantId: 1, quantity: 2 },
      { variantId: 2, quantity: 1 },
      { variantId: 3, quantity: 1 },
    ]).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(OutOfStockError);
    expect((error as OutOfStockError).variantIds).toEqual([1, 2]);
    expect((error as OutOfStockError).status).toBe(409);
  });

  it("lets only one of two buyers take the last item", async () => {
    const { tx, stock } = fakeTx({ 7: 1 });
    const results = await Promise.allSettled([
      decrementStock(tx, [{ variantId: 7, quantity: 1 }]),
      decrementStock(tx, [{ variantId: 7, quantity: 1 }]),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(stock.get(7)).toBe(0);
  });

  it("puts stock back on release and skips deleted variants", async () => {
    const { tx, stock } = fakeTx({ 1: 0 });
    await releaseStock(tx, [
      { variantId: 1, quantity: 2 },
      { variantId: null, quantity: 4 },
      { variantId: 1, quantity: 1 },
    ]);
    expect(stock.get(1)).toBe(3);
  });

  it("merges lines by variant", () => {
    expect(
      mergeLines([
        { variantId: 2, quantity: 1 },
        { variantId: 1, quantity: 1 },
        { variantId: 2, quantity: 3 },
      ]),
    ).toEqual([
      { variantId: 2, quantity: 4 },
      { variantId: 1, quantity: 1 },
    ]);
  });
});
