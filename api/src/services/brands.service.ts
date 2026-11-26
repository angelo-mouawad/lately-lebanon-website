import type { z } from "zod";
import type { AdminBrand, AdminBrandRow, brandSchema } from "@latelylebanon/shared";
import { conflict, notFound } from "../lib/errors";
import { prisma, type Tx } from "../lib/prisma";
import { maybeImageSet } from "../storage/images";
import { deleteUnusedImages } from "./image-cleanup";
import { uniqueSlug } from "./slugs";
import { refreshWebsite } from "./revalidate";

type BrandData = z.output<typeof brandSchema>;

const slugTaken = (exceptId?: number) => async (slug: string) =>
  Boolean(await prisma.brand.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined }, select: { id: true } }));

export async function listAdminBrands(): Promise<AdminBrandRow[]> {
  const rows = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { status: { not: "ARCHIVED" } } } } } },
  });
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: maybeImageSet(b.logoKey, b.name),
    isActive: b.isActive,
    commissionPct: Number(b.commissionPct),
    ownDelivery: b.ownDelivery,
    productCount: b._count.products,
  }));
}

export async function getAdminBrand(id: number): Promise<AdminBrand> {
  const b = await prisma.brand.findUnique({
    where: { id },
    include: { deliveryFees: { select: { zoneId: true, feeCents: true } } },
  });
  if (!b) throw notFound("That brand");
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: maybeImageSet(b.logoKey, b.name),
    cover: maybeImageSet(b.coverKey, b.name),
    story: b.story,
    instagramUrl: b.instagramUrl,
    contactName: b.contactName,
    phone: b.phone,
    email: b.email,
    commissionPct: Number(b.commissionPct),
    ownDelivery: b.ownDelivery,
    deliveryFees: b.deliveryFees,
    internalNotes: b.internalNotes,
    isActive: b.isActive,
  };
}

function fields(data: BrandData) {
  return {
    name: data.name,
    logoKey: data.logoKey ?? null,
    coverKey: data.coverKey ?? null,
    story: data.story,
    instagramUrl: data.instagramUrl,
    contactName: data.contactName,
    phone: data.phone,
    email: data.email,
    commissionPct: data.commissionPct,
    ownDelivery: data.ownDelivery,
    internalNotes: data.internalNotes,
    isActive: data.isActive,
  };
}

/**
 * Replaces the brand's delivery prices. Prices are kept when own delivery is switched
 * off, so switching it back on brings them back. Areas that no longer exist are skipped.
 */
async function saveDeliveryFees(tx: Tx, brandId: number, fees: BrandData["deliveryFees"]) {
  const zoneIds = new Set(
    (await tx.deliveryZone.findMany({ where: { id: { in: fees.map((f) => f.zoneId) } }, select: { id: true } })).map((z) => z.id),
  );
  await tx.brandDeliveryFee.deleteMany({ where: { brandId } });
  const rows = fees.filter((f) => zoneIds.has(f.zoneId)).map((f) => ({ brandId, zoneId: f.zoneId, feeCents: f.feeCents }));
  if (rows.length > 0) await tx.brandDeliveryFee.createMany({ data: rows });
}

export async function createBrand(data: BrandData): Promise<AdminBrand> {
  if (data.slug && (await slugTaken()(data.slug))) {
    throw conflict("Another brand already uses this web address.", { slug: "Already used by another brand" });
  }
  const slug = data.slug ?? (await uniqueSlug(data.name, slugTaken()));
  const brand = await prisma.$transaction(async (tx) => {
    const created = await tx.brand.create({ data: { ...fields(data), slug } });
    await saveDeliveryFees(tx, created.id, data.deliveryFees);
    return created;
  });
  refreshWebsite("catalog");
  return getAdminBrand(brand.id);
}

export async function updateBrand(id: number, data: BrandData): Promise<AdminBrand> {
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw notFound("That brand");
  const slug = data.slug ?? existing.slug;
  if (slug !== existing.slug && (await slugTaken(id)(slug))) {
    throw conflict("Another brand already uses this web address.", { slug: "Already used by another brand" });
  }
  await prisma.$transaction(async (tx) => {
    await tx.brand.update({ where: { id }, data: { ...fields(data), slug } });
    await saveDeliveryFees(tx, id, data.deliveryFees);
  });
  await deleteUnusedImages(
    [existing.logoKey, existing.coverKey].filter((k) => k !== data.logoKey && k !== data.coverKey),
  );
  refreshWebsite("catalog");
  return getAdminBrand(id);
}

/** A brand can only be deleted while it has no products and no orders. Otherwise, hide it. */
export async function deleteBrand(id: number): Promise<void> {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true, orderItems: true, payouts: true } } },
  });
  if (!brand) throw notFound("That brand");
  if (brand._count.products + brand._count.orderItems + brand._count.payouts > 0) {
    throw conflict("This brand has products or orders, so it can't be deleted. Turn off \"Show on website\" instead.");
  }
  await prisma.brand.delete({ where: { id } });
  await deleteUnusedImages([brand.logoKey, brand.coverKey]);
  refreshWebsite("catalog");
}
