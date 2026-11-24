import type { Prisma } from "@prisma/client";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { getProvider } from "../payments";
import { notifyNewOrder } from "./order-notifications";
import { refreshWebsite } from "./revalidate";
import { releaseStock } from "./stock";

export type ConfirmOutcome = "paid" | "already_paid" | "pending" | "failed" | "not_found";

/**
 * Checks an online payment with the provider and updates the order.
 * Called from the return redirect, webhooks, provider callbacks and the expiry cron.
 * It's safe to call many times: only the first confirmation changes anything.
 */
export async function confirmOnlinePayment(orderNumber: string): Promise<ConfirmOutcome> {
  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order || order.paymentMethod === "COD") return "not_found";
  if (order.paymentStatus === "PAID") return "already_paid";

  const provider = getProvider(order.paymentMethod);
  const payment = order.payments[0];
  if (!provider?.verify || !payment) return "pending";

  let result;
  try {
    result = await provider.verify({ orderNumber: order.number, providerRef: payment.providerRef, amountCents: order.totalCents });
  } catch (err) {
    logger.error(`Payment check for ${order.number} failed`, err);
    return "pending";
  }

  const raw = (result.raw ?? undefined) as Prisma.InputJsonValue | undefined;

  if (result.status === "PAID") {
    const wasCancelled = order.status === "CANCELLED";
    const changed = await prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: { not: "PAID" } },
        data: { paymentStatus: "PAID", paidAt: new Date() },
      });
      if (count === 0) return false;
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED", providerRef: result.reference ?? payment.providerRef, raw },
      });
      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          status: order.status,
          note: wasCancelled
            ? `Payment received after the order was cancelled. Refund the customer or restore the order by hand.`
            : `Payment confirmed by ${provider.label}`,
        },
      });
      return true;
    });
    if (!changed) return "already_paid";
    if (wasCancelled) logger.warn(`Order ${order.number} was paid after being cancelled`);
    else void notifyNewOrder(order.id);
    return "paid";
  }

  if (result.status === "FAILED") {
    const cancelled = await prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: order.id, status: "NEW", paymentStatus: { not: "PAID" } },
        data: { status: "CANCELLED", paymentStatus: "FAILED", stockReleased: true },
      });
      if (count === 0) return false;
      await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED", raw } });
      await tx.orderStatusEvent.create({ data: { orderId: order.id, status: "CANCELLED", note: `Payment failed at ${provider.label}` } });
      if (!order.stockReleased) {
        const items = await tx.orderItem.findMany({ where: { orderId: order.id }, select: { variantId: true, quantity: true } });
        await releaseStock(tx, items);
        if (order.promoCodeId) {
          await tx.$executeRaw`UPDATE PromoCode SET timesUsed = GREATEST(timesUsed - 1, 0) WHERE id = ${order.promoCodeId}`;
        }
      }
      return true;
    });
    if (cancelled) refreshWebsite("catalog");
    return "failed";
  }

  return "pending";
}
