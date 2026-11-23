import { Prisma } from "@prisma/client";
import type { AdminRole, DashboardData } from "@latelylebanon/shared";
import { prisma } from "../lib/prisma";
import { orderRowSelect, toOrderRow } from "./serializers";
import { COUNTED_ORDER_STATUS } from "./balances.service";

const LOW_STOCK = 3;

/** Orders that still count as revenue (not cancelled or returned). */
const live: Prisma.OrderWhereInput = { status: { notIn: ["CANCELLED", "RETURNED"] } };

/** Midnight and first of the month in the server's time zone. Set TZ=Asia/Beirut on the server. */
function periodStarts(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  return { today, month };
}

async function commissionCents(where: Prisma.Sql): Promise<number> {
  const rows = await prisma.$queryRaw<{ total: Prisma.Decimal | null }[]>`
    SELECT SUM(ROUND(oi.lineTotalCents * oi.commissionPct / 100)) AS total
    FROM OrderItem oi JOIN \`Order\` o ON o.id = oi.orderId
    WHERE ${where}`;
  return Number(rows[0]?.total ?? 0);
}

export async function getDashboard(role: AdminRole): Promise<DashboardData> {
  const { today, month } = periodStarts();

  const [ordersToday, ordersThisMonth, newOrdersWaiting, lowStock, latest] = await Promise.all([
    prisma.order.count({ where: { ...live, createdAt: { gte: today } } }),
    prisma.order.count({ where: { ...live, createdAt: { gte: month } } }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK }, product: { status: "PUBLISHED" } },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { stock: "asc" },
      take: 12,
    }),
    prisma.order.findMany({ select: orderRowSelect, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  let money: DashboardData["money"] = null;
  if (role === "OWNER") {
    const [revenueToday, revenueMonth, commissionMonth, commissionAll] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalCents: true }, where: { ...live, createdAt: { gte: today } } }),
      prisma.order.aggregate({ _sum: { totalCents: true }, where: { ...live, createdAt: { gte: month } } }),
      commissionCents(Prisma.sql`o.status NOT IN ('CANCELLED', 'RETURNED') AND o.createdAt >= ${month}`),
      commissionCents(Prisma.sql`o.status = ${COUNTED_ORDER_STATUS}`),
    ]);
    money = {
      revenueTodayCents: revenueToday._sum.totalCents ?? 0,
      revenueThisMonthCents: revenueMonth._sum.totalCents ?? 0,
      commissionThisMonthCents: commissionMonth,
      commissionAllTimeCents: commissionAll,
    };
  }

  return {
    ordersToday,
    ordersThisMonth,
    newOrdersWaiting,
    money,
    lowStock: lowStock.map((v) => ({
      productId: v.product.id,
      productName: v.product.name,
      variantLabel: v.label,
      stock: v.stock,
    })),
    latestOrders: latest.map(toOrderRow),
  };
}
