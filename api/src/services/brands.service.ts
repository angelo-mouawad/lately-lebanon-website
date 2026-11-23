import type { z } from "zod";
import type { AdminBrand, AdminBrandRow, brandSchema } from "@latelylebanon/shared";
import { conflict, notFound } from "../lib/errors";
import { prisma } from "../lib/prisma";
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
    productCount: b._count.products,
  }));
}

export async function getAdminBrand(id: number): Promise<AdminBrand> {
  const b = await prisma.brand.findUnique({ where: { id } });
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
    internalNotes: data.internalNotes,
    isActive: data.isActive,
  };
}

export async function createBrand(data: BrandData): Promise<AdminBrand> {
  if (data.slug && (await slugTaken()(data.slug))) {
    throw conflict("Another brand already uses this web address.", { slug: "Already used by another brand" });
  }
  const brand = await prisma.brand.create({
    data: { ...fields(data), slug: data.slug ?? (await uniqueSlug(data.name, slugTaken())) },
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
  await prisma.brand.update({ where: { id }, data: { ...fields(data), slug } });
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
