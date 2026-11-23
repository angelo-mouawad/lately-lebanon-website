import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import {
  canMoveOrder,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  UNPAID_ORDER_TTL_MINUTES,
  type AdminOrder,
  type AdminOrderRow,
  type OrderStatus,
  type Paginated,
  type TrackedOrder,
  type orderListQuerySchema,
} from "@latelylebanon/shared";
import { AppError, badRequest, conflict, notFound } from "../lib/errors";
import { logger } from "../lib/logger";
import { prisma, type Tx } from "../lib/prisma";
import { maybeImageSet } from "../storage/images";
import { refreshWebsite } from "./revalidate";
import { orderRowSelect, paginate, toOrderRow } from "./serializers";
import { releaseStock } from "./stock";

const ADMIN_PAGE_SIZE = 25;

/* ---------- Customer tracking ---------- */

export async function trackOrder(number: string, phone: string): Promise<TrackedOrder> {
  const order = await prisma.order.findFirst({
    where: { number, phone },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) {
    throw new AppError(404, "not_found", "We couldn't find an order with that number and phone. Please check both and try again.");
  }
  return {
    number: order.number,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
    totalCents: order.totalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    discountCents: order.discountCents,
    items: order.items.map((i) => ({
      productName: i.productName,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
    })),
    history: order.events.map((e) => ({ status: e.status, at: e.createdAt.toISOString() })),
  };
}

/* ---------- Admin ---------- */

export async function listOrders(query: z.output<typeof orderListQuerySchema>): Promise<Paginated<AdminOrderRow>> {
  const where: Prisma.OrderWhereInput = {
    status: query.status,
    paymentMethod: query.paymentMethod,
    ...(query.brandId ? { items: { some: { brandId: query.brandId } } } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(`${query.from}T00:00:00`) } : {}),
            ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999`) } : {}),
          },
        }
      : {}),
    ...(query.q
      ? {
          OR: [
            { number: { contains: query.q.toUpperCase() } },
            { customerName: { contains: query.q } },
            { phone: { contains: query.q.replace(/\D/g, "") || query.q } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      select: orderRowSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);
  return paginate(rows.map(toOrderRow), total, query.page, ADMIN_PAGE_SIZE);
}

export async function getOrder(id: number): Promise<AdminOrder> {
  const o = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          brand: { select: { id: true, name: true, phone: true } },
          product: { select: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        },
      },
      events: { orderBy: { createdAt: "asc" }, include: { adminUser: { select: { name: true } } } },
      payments: { orderBy: { createdAt: "asc" } },
      _count: { select: { items: true } },
    },
  });
  if (!o) throw notFound("That order");
  return {
    ...toOrderRow(o),
    email: o.email,
    city: o.city,
    address: o.address,
    notes: o.notes,
    subtotalCents: o.subtotalCents,
    deliveryFeeCents: o.deliveryFeeCents,
    discountCents: o.discountCents,
    promoCode: o.promoCode,
    paidAt: o.paidAt?.toISOString() ?? null,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      variantLabel: i.variantLabel,
      brand: i.brand,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      lineTotalCents: i.lineTotalCents,
      commissionPct: Number(i.commissionPct),
      image: maybeImageSet(i.product.images[0]?.key, i.productName),
    })),
    history: o.events.map((e) => ({
      status: e.status,
      note: e.note,
      by: e.adminUser?.name ?? null,
      at: e.createdAt.toISOString(),
    })),
    payments: o.payments.map((p) => ({
      provider: p.provider,
      amountCents: p.amountCents,
      status: p.status,
      reference: p.providerRef,
      at: p.createdAt.toISOString(),
    })),
    nextStatuses: [...ORDER_STATUS_FLOW[o.status]],
  };
}

/** Cancels an order inside a transaction and puts its stock and promo use back, once. */
async function cancelInTx(tx: Tx, orderId: number) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.stockReleased) return;
  await releaseStock(tx, order.items);
  await tx.order.update({ where: { id: orderId }, data: { stockReleased: true } });
  if (order.promoCodeId) {
    await tx.$executeRaw`UPDATE PromoCode SET timesUsed = GREATEST(timesUsed - 1, 0) WHERE id = ${order.promoCodeId}`;
  }
}

export async function updateOrderStatus(
  orderId: number,
  to: OrderStatus,
  note: string | null,
  adminUserId: number,
): Promise<AdminOrder> {
  const current = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!current) throw notFound("That order");
  if (!canMoveOrder(current.status, to)) {
    throw badRequest(
      `An order that is "${ORDER_STATUS_LABELS[current.status]}" can't be moved to "${ORDER_STATUS_LABELS[to]}".`,
    );
  }

  await prisma.$transaction(async (tx) => {
    // Only update if nobody else changed the status in the meantime.
    const { count } = await tx.order.updateMany({ where: { id: orderId, status: current.status }, data: { status: to } });
    if (count !== 1) throw conflict("Someone else just updated this order. Please refresh the page.");
    await tx.orderStatusEvent.create({ data: { orderId, status: to, note, adminUserId } });
    if (to === "CANCELLED") await cancelInTx(tx, orderId);
  });

  if (to === "CANCELLED") refreshWebsite("catalog");
  return getOrder(orderId);
}

export async function markOrderPaid(orderId: number, adminUserId: number): Promise<AdminOrder> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw notFound("That order");
  if (order.paymentMethod !== "COD") throw badRequest("Only cash on delivery orders can be marked as paid by hand.");
  if (order.paymentStatus === "PAID") throw badRequest("This order is already marked as paid.");
  if (order.status === "CANCELLED") throw badRequest("This order was cancelled.");

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", paidAt: new Date() } }),
    prisma.payment.updateMany({ where: { orderId, provider: "COD" }, data: { status: "SUCCEEDED" } }),
    prisma.orderStatusEvent.create({
      data: { orderId, status: order.status, note: "Cash received, marked as paid", adminUserId },
    }),
  ]);
  return getOrder(orderId);
}

/**
 * Cancels card and Whish orders that were never paid and releases their stock.
 * Called by a cron job every few minutes.
 */
export async function expireUnpaidOrders(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - UNPAID_ORDER_TTL_MINUTES * 60_000);
  const stale = await prisma.order.findMany({
    where: {
      paymentMethod: { in: ["CARD", "WHISH"] },
      paymentStatus: { in: ["UNPAID", "PENDING", "FAILED"] },
      status: "NEW",
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    take: 200,
  });

  let cancelled = 0;
  for (const { id } of stale) {
    try {
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.order.updateMany({
          where: { id, status: "NEW", paymentStatus: { not: "PAID" } },
          data: { status: "CANCELLED", paymentStatus: "FAILED" },
        });
        if (count !== 1) return;
        await tx.payment.updateMany({ where: { orderId: id, status: "PENDING" }, data: { status: "EXPIRED" } });
        await tx.orderStatusEvent.create({
          data: { orderId: id, status: "CANCELLED", note: `Not paid within ${UNPAID_ORDER_TTL_MINUTES} minutes` },
        });
        await cancelInTx(tx, id);
        cancelled++;
      });
    } catch (err) {
      logger.error(`Could not expire order ${id}`, err);
    }
  }
  if (cancelled > 0) refreshWebsite("catalog");
  return cancelled;
}
