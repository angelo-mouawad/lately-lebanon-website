import { whatsappNumbers } from "@latelylebanon/shared";
import { sendMail } from "../email/mailer";
import { adminNewOrder, customerConfirmation, type EmailOrder } from "../email/templates";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { loadSettings } from "./settings.service";

/**
 * Emails the customer (when they gave an address) and our team about a new order.
 * Called once the order is confirmed: straight away for cash on delivery, and after
 * the payment provider confirms payment for card and Whish.
 */
export async function notifyNewOrder(orderId: number): Promise<void> {
  try {
    const [order, settings] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { brand: { select: { name: true } } } } },
      }),
      loadSettings(),
    ]);
    if (!order) return;

    const emailOrder: EmailOrder = {
      ...order,
      items: order.items.map((i) => ({
        productName: i.productName,
        variantLabel: i.variantLabel,
        quantity: i.quantity,
        lineTotalCents: i.lineTotalCents,
        brandName: i.brand.name,
      })),
    };
    const ctx = { storeName: settings.storeName, webOrigin: env.WEB_ORIGIN, whatsappNumbers: whatsappNumbers(settings) };

    const sends: Promise<boolean>[] = [];
    if (order.email) {
      // No reply-to: customer replies go back to the sending orders mailbox, not the general contact address.
      sends.push(sendMail({ to: order.email, ...customerConfirmation(emailOrder, ctx) }));
    }
    sends.push(
      sendMail({
        to: env.ADMIN_NOTIFY_EMAIL,
        ...adminNewOrder(emailOrder, ctx, `${env.WEB_ORIGIN}/admin/orders/${order.id}`),
      }),
    );
    await Promise.all(sends);
  } catch (err) {
    logger.error(`Order notification for order ${orderId} failed`, err);
  }
}
