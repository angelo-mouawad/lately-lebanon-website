import { AppError } from "../lib/errors";

export interface StockLine {
  variantId: number;
  quantity: number;
}

/** Minimal slice of a Prisma transaction client that stock changes need. */
export interface StockTx {
  productVariant: {
    updateMany(args: {
      where: { id: number; stock?: { gte: number } };
      data: { stock: { decrement: number } | { increment: number } };
    }): Promise<{ count: number }>;
  };
}

export class OutOfStockError extends AppError {
  constructor(public readonly variantIds: number[]) {
    super(409, "out_of_stock", "Some items in your bag just sold out. We've updated your bag, please check it again.");
  }
}

/** Combines lines for the same variant so stock is checked against the full quantity. */
export function mergeLines(lines: StockLine[]): StockLine[] {
  const merged = new Map<number, number>();
  for (const line of lines) merged.set(line.variantId, (merged.get(line.variantId) ?? 0) + line.quantity);
  return [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));
}

/**
 * Decrements stock inside a transaction. Each update only succeeds when enough stock is
 * left, so two customers can never buy the last item at the same time.
 * Throws OutOfStockError (rolling back the transaction) when any line can't be filled.
 */
export async function decrementStock(tx: StockTx, lines: StockLine[]): Promise<void> {
  const soldOut: number[] = [];
  for (const { variantId, quantity } of mergeLines(lines)) {
    const { count } = await tx.productVariant.updateMany({
      where: { id: variantId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (count === 0) soldOut.push(variantId);
  }
  if (soldOut.length > 0) throw new OutOfStockError(soldOut);
}

/** Puts stock back, for example when an order is cancelled. Deleted variants are skipped. */
export async function releaseStock(tx: StockTx, lines: { variantId: number | null; quantity: number }[]): Promise<void> {
  const existing = lines.filter((l): l is StockLine => l.variantId != null);
  for (const { variantId, quantity } of mergeLines(existing)) {
    await tx.productVariant.updateMany({
      where: { id: variantId },
      data: { stock: { increment: quantity } },
    });
  }
}
