import type { z } from "zod";
import type { BrandBalance, BrandPayoutRow, payoutSchema } from "@latelylebanon/shared";
import { badRequest, notFound } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { computeBrandBalances } from "./balance-calc";

/**
 * Sales count towards a brand's balance once the order is delivered.
 * Cancelled and returned orders never count.
 */
export const COUNTED_ORDER_STATUS = "DELIVERED" as const;

export async function getBrandBalances(): Promise<BrandBalance[]> {
  const [brands, sales, payouts] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.orderItem.findMany({
      where: { order: { status: COUNTED_ORDER_STATUS } },
      select: { brandId: true, lineTotalCents: true, commissionPct: true },
    }),
    prisma.brandPayout.findMany({ select: { brandId: true, amountCents: true } }),
  ]);
  return computeBrandBalances(
    brands,
    sales.map((s) => ({ ...s, commissionPct: Number(s.commissionPct) })),
    payouts,
  );
}

export async function listPayouts(brandId?: number): Promise<BrandPayoutRow[]> {
  const rows = await prisma.brandPayout.findMany({
    where: { brandId },
    include: { brand: { select: { name: true } }, createdBy: { select: { name: true } } },
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
    take: 500,
  });
  return rows.map((p) => ({
    id: p.id,
    brandId: p.brandId,
    brandName: p.brand.name,
    amountCents: p.amountCents,
    paidAt: p.paidAt.toISOString().slice(0, 10),
    method: p.method,
    note: p.note,
    recordedBy: p.createdBy?.name ?? null,
  }));
}

export async function recordPayout(data: z.output<typeof payoutSchema>, adminUserId: number): Promise<BrandPayoutRow[]> {
  if (!(await prisma.brand.findUnique({ where: { id: data.brandId }, select: { id: true } }))) {
    throw notFound("That brand");
  }
  if (new Date(data.paidAt) > new Date()) throw badRequest("The date can't be in the future.", { paidAt: "Pick today or earlier" });
  await prisma.brandPayout.create({
    data: {
      brandId: data.brandId,
      amountCents: data.amountCents,
      paidAt: new Date(`${data.paidAt}T00:00:00Z`),
      method: data.method,
      note: data.note,
      createdById: adminUserId,
    },
  });
  return listPayouts(data.brandId);
}

export async function deletePayout(id: number): Promise<void> {
  const { count } = await prisma.brandPayout.deleteMany({ where: { id } });
  if (count === 0) throw notFound("That payout");
}

const csvCell = (value: string | number) => {
  const s = String(value);
  // Quote cells and neutralise leading formula characters so spreadsheets don't run them.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

const dollars = (cents: number) => (cents / 100).toFixed(2);

export async function balancesCsv(): Promise<string> {
  const balances = await getBrandBalances();
  const header = ["Brand", "Total sales (USD)", "Our commission (USD)", "Owed to brand (USD)", "Paid out (USD)", "Balance (USD)"];
  const rows = balances.map((b) => [
    b.brandName,
    dollars(b.totalSalesCents),
    dollars(b.commissionCents),
    dollars(b.owedToBrandCents),
    dollars(b.paidOutCents),
    dollars(b.balanceCents),
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
