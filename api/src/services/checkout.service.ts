import { randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type {
  CartQuoteInput,
  CheckoutData,
  CheckoutResult,
  QuoteLine,
  QuoteResult,
} from "@latelylebanon/shared";
import { AppError, badRequest } from "../lib/errors";
import { logger } from "../lib/logger";
import { prisma, type Db, type Tx } from "../lib/prisma";
import { getEnabledProvider } from "../payments";
import { imageSet } from "../storage/images";
import { buildOrderItems, type PurchasableVariant } from "./order-items";
import { computeTotals, variantPrice } from "./pricing";
import { refreshWebsite } from "./revalidate";
import { loadSettings } from "./settings.service";
import { decrementStock, mergeLines, releaseStock } from "./stock";
import { notifyNewOrder } from "./order-notifications";

const variantInclude = {
  product: {
    include: {
      brand: { select: { name: true, commissionPct: true, isActive: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  },
} satisfies Prisma.ProductVariantInclude;

type LoadedVariant = Prisma.ProductVariantGetPayload<{ include: typeof variantInclude }>;

async function loadVariants(db: Db, ids: number[]): Promise<Map<number, LoadedVariant>> {
  const rows = await db.productVariant.findMany({ where: { id: { in: ids } }, include: variantInclude });
  return new Map(rows.map((v) => [v.id, v]));
}

const isPurchasable = (v: LoadedVariant | undefined): v is LoadedVariant =>
  Boolean(v && v.product.status === "PUBLISHED" && v.product.brand.isActive);

function toPurchasable(v: LoadedVariant): PurchasableVariant {
  return {
    id: v.id,
    label: v.label,
    priceCents: v.priceCents,
    product: {
      id: v.product.id,
      name: v.product.name,
      priceCents: v.product.priceCents,
      commissionPct: v.product.commissionPct == null ? null : Number(v.product.commissionPct),
      brandId: v.product.brandId,
      brand: { commissionPct: Number(v.product.brand.commissionPct) },
    },
  };
}

async function findPromo(db: Db, code: string | null | undefined) {
  if (!code?.trim()) return undefined;
  return db.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
}

async function activeZone(db: Db, zoneId: number | null | undefined) {
  if (!zoneId) return null;
  return db.deliveryZone.findFirst({ where: { id: zoneId, isActive: true } });
}

/**
 * Brand id to fee, for brands in the cart that deliver themselves to this zone.
 * Brands with their own delivery switched off, or no price for this zone, are left
 * out: we deliver their items at our usual fee.
 */
async function brandFeesForZone(db: Db, zoneId: number | null | undefined, brandIds: number[]): Promise<Map<number, number>> {
  if (!zoneId || brandIds.length === 0) return new Map();
  const rows = await db.brandDeliveryFee.findMany({
    where: { zoneId, brandId: { in: [...new Set(brandIds)] }, brand: { ownDelivery: true } },
    select: { brandId: true, feeCents: true },
  });
  return new Map(rows.map((r) => [r.brandId, r.feeCents]));
}

/**
 * Prices a cart from the database. Used by the cart and checkout pages to show
 * up to date prices, stock and totals. Never trusts prices from the browser.
 */
export async function quoteCart(input: CartQuoteInput): Promise<QuoteResult> {
  const lines = mergeLines(input.items);
  const [variants, zone, promo, settings] = await Promise.all([
    loadVariants(prisma, lines.map((l) => l.variantId)),
    activeZone(prisma, input.zoneId),
    findPromo(prisma, input.promoCode),
    loadSettings(),
  ]);

  const brandIdOf = new Map([...variants.values()].map((v) => [v.id, v.product.brandId]));
  const brandNames = new Map([...variants.values()].map((v) => [v.product.brandId, v.product.brand.name]));
  const brandFees = zone ? await brandFeesForZone(prisma, zone.id, [...brandNames.keys()]) : new Map<number, number>();

  const quoteLines: QuoteLine[] = lines.flatMap(({ variantId, quantity }) => {
    const v = variants.get(variantId);
    if (!v) return [];
    const available = isPurchasable(v) && v.stock > 0;
    const unitPriceCents = variantPrice(v.product.priceCents, v.priceCents);
    const qty = available ? Math.min(quantity, v.stock) : 0;
    const image = v.product.images[0];
    return [
      {
        variantId,
        productId: v.product.id,
        productName: v.product.name,
        productSlug: v.product.slug,
        brandName: v.product.brand.name,
        variantLabel: v.label,
        image: image ? imageSet(image.key, image.alt || v.product.name) : null,
        unitPriceCents,
        requestedQuantity: quantity,
        quantity: qty,
        stock: isPurchasable(v) ? v.stock : 0,
        lineTotalCents: unitPriceCents * qty,
        available,
      },
    ];
  });

  const totals = computeTotals({
    lines: quoteLines.map((l) => ({ ...l, brandId: brandIdOf.get(l.variantId) })),
    zoneFeeCents: zone?.feeCents ?? null,
    brandFees,
    freeDeliveryThresholdCents: settings.freeDeliveryThresholdCents,
    promo,
  });

  return {
    lines: quoteLines,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    deliveryFeeCents: totals.deliveryFeeCents,
    shopDeliveryFeeCents: totals.shopDelivers ? totals.shopDeliveryFeeCents : null,
    brandDeliveries: totals.brandDeliveries.map((d) => ({ brandName: brandNames.get(d.brandId) ?? "", feeCents: d.feeCents })),
    totalCents: totals.totalCents,
    freeDeliveryThresholdCents: settings.freeDeliveryThresholdCents,
    promo: input.promoCode?.trim()
      ? {
          code: input.promoCode.trim().toUpperCase(),
          applied: Boolean(totals.promo?.ok),
          message: totals.promo && !totals.promo.ok ? totals.promo.message : null,
        }
      : null,
  };
}

async function uniqueOrderNumber(tx: Tx): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const number = `LL-${randomInt(10000, 100000)}`;
    const taken = await tx.order.findUnique({ where: { number }, select: { id: true } });
    if (!taken) return number;
  }
  throw new Error("Could not generate a unique order number");
}

/** Claims one use of a promo code. Fails safely if two customers race for the last use. */
async function claimPromoUse(tx: Tx, promoId: number): Promise<boolean> {
  const affected = await tx.$executeRaw`
    UPDATE PromoCode SET timesUsed = timesUsed + 1
    WHERE id = ${promoId} AND (usageLimit IS NULL OR timesUsed < usageLimit)`;
  return affected === 1;
}

/**
 * Places an order. Every price, discount and fee is recalculated here, and stock is
 * checked and decremented in the same transaction as the order is created.
 */
export async function placeOrder(data: CheckoutData): Promise<CheckoutResult> {
  const provider = getEnabledProvider(data.paymentMethod);
  const lines = mergeLines(data.items);

  const order = await prisma.$transaction(
    async (tx) => {
      const variants = await loadVariants(tx, lines.map((l) => l.variantId));
      const missing = lines.filter((l) => !isPurchasable(variants.get(l.variantId)));
      if (missing.length > 0) {
        throw new AppError(
          409,
          "unavailable",
          "Something in your bag is no longer available. We've updated your bag, please check it again.",
        );
      }

      const zone = await activeZone(tx, data.customer.zoneId);
      if (!zone) throw badRequest("Please choose your area.", { zoneId: "Please choose your area" });

      const settings = await loadSettings(tx);
      const promo = await findPromo(tx, data.promoCode);

      const items = buildOrderItems(
        lines,
        new Map([...variants].map(([id, v]) => [id, toPurchasable(v)])),
      );
      const brandFees = await brandFeesForZone(tx, zone.id, items.map((i) => i.brandId));
      const totals = computeTotals({
        lines: items,
        zoneFeeCents: zone.feeCents,
        brandFees,
        freeDeliveryThresholdCents: settings.freeDeliveryThresholdCents,
        promo,
      });

      if (totals.promo && !totals.promo.ok) {
        throw badRequest(totals.promo.message, { promoCode: totals.promo.message });
      }
      if (promo && !(await claimPromoUse(tx, promo.id))) {
        const message = "This code has already been used up.";
        throw badRequest(message, { promoCode: message });
      }

      await decrementStock(tx, lines);

      return tx.order.create({
        data: {
          number: await uniqueOrderNumber(tx),
          customerName: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email,
          city: data.customer.city,
          region: zone.name,
          deliveryZoneId: zone.id,
          address: data.customer.address,
          notes: data.customer.notes,
          subtotalCents: totals.subtotalCents,
          deliveryFeeCents: totals.deliveryFeeCents,
          discountCents: totals.discountCents,
          totalCents: totals.totalCents,
          promoCodeId: promo?.id ?? null,
          promoCode: promo?.code ?? null,
          paymentMethod: provider.method,
          paymentStatus: provider.method === "COD" ? "UNPAID" : "PENDING",
          items: { create: items },
          brandDeliveries: { create: totals.brandDeliveries },
          events: { create: { status: "NEW" } },
          payments: { create: { provider: provider.method, amountCents: totals.totalCents } },
        },
        include: { payments: true },
      });
    },
    { timeout: 15000 },
  );

  let redirectUrl: string | null = null;
  if (provider.method !== "COD") {
    try {
      const started = await provider.start(order);
      redirectUrl = started.redirectUrl;
      await prisma.payment.update({
        where: { id: order.payments[0]!.id },
        data: { providerRef: started.providerRef, raw: (started.raw ?? undefined) as object | undefined },
      });
    } catch (err) {
      logger.error("Payment could not be started", err);
      await cancelUnstartedPayment(order.id);
      throw new AppError(
        502,
        "payment_unavailable",
        "We couldn't open the payment page. Your order was not placed, please try again or choose cash on delivery.",
      );
    }
  }

  if (provider.method === "COD") void notifyNewOrder(order.id);
  void refreshIfSoldOut(lines.map((l) => l.variantId));

  return { orderNumber: order.number, redirectUrl };
}

async function cancelUnstartedPayment(orderId: number) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
        stockReleased: true,
        events: { create: { status: "CANCELLED", note: "Payment page could not be opened" } },
      },
      include: { items: true },
    });
    await tx.payment.updateMany({ where: { orderId }, data: { status: "FAILED" } });
    await releaseStock(tx, order.items);
    if (order.promoCodeId) {
      await tx.$executeRaw`UPDATE PromoCode SET timesUsed = GREATEST(timesUsed - 1, 0) WHERE id = ${order.promoCodeId}`;
    }
  });
}

async function refreshIfSoldOut(variantIds: number[]) {
  try {
    const soldOut = await prisma.productVariant.count({ where: { id: { in: variantIds }, stock: 0 } });
    if (soldOut > 0) refreshWebsite("catalog");
  } catch (err) {
    logger.warn("Sold out check failed", err);
  }
}
