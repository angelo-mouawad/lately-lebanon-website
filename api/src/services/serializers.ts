import type { Prisma } from "@prisma/client";
import type {
  AdminOrderRow,
  PublicBrandCard,
  PublicProductCard,
} from "@latelylebanon/shared";
import { imageSet, maybeImageSet } from "../storage/images";

/* ---------- JSON column helpers ---------- */

export function asStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function asNumberArray(value: Prisma.JsonValue): number[] {
  return Array.isArray(value) ? value.filter((v): v is number => typeof v === "number") : [];
}

export function asOptions(value: Prisma.JsonValue): { name: string; values: string[] }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((o) => {
    if (!o || typeof o !== "object" || Array.isArray(o)) return [];
    const name = (o as Record<string, unknown>).name;
    const values = (o as Record<string, unknown>).values;
    if (typeof name !== "string" || !Array.isArray(values)) return [];
    return [{ name, values: values.filter((v): v is string => typeof v === "string") }];
  });
}

export function asRecord(value: Prisma.JsonValue): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((e): e is [string, string] => typeof e[1] === "string"),
  );
}

export const toNumber = (d: Prisma.Decimal | number | null): number | null => (d == null ? null : Number(d));

/* ---------- Product cards ---------- */

export const cardInclude = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 2 },
  variants: { select: { priceCents: true, stock: true } },
} satisfies Prisma.ProductInclude;

export type CardProduct = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export function priceSummary(product: { priceCents: number; variants: { priceCents: number | null }[] }) {
  const prices = product.variants.map((v) => v.priceCents ?? product.priceCents);
  if (prices.length === 0) return { priceCents: product.priceCents, priceVaries: false };
  return { priceCents: Math.min(...prices), priceVaries: new Set(prices).size > 1 };
}

export function toProductCard(p: CardProduct): PublicProductCard {
  const [first, second] = p.images;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    ...priceSummary(p),
    compareAtCents: p.compareAtCents,
    inStock: p.variants.some((v) => v.stock > 0),
    image: first ? imageSet(first.key, first.alt || p.name) : null,
    hoverImage: second ? imageSet(second.key, second.alt || p.name) : null,
    brand: p.brand,
    category: p.category,
    createdAt: (p.publishedAt ?? p.createdAt).toISOString(),
  };
}

/* ---------- Brands ---------- */

export const publicBrandSelect = {
  id: true,
  name: true,
  slug: true,
  logoKey: true,
  coverKey: true,
  story: true,
  instagramUrl: true,
  _count: { select: { products: { where: { status: "PUBLISHED" } } } },
} satisfies Prisma.BrandSelect;

export type PublicBrandRow = Prisma.BrandGetPayload<{ select: typeof publicBrandSelect }>;

export function toBrandCard(b: PublicBrandRow): PublicBrandCard {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: maybeImageSet(b.logoKey, `${b.name} logo`),
    cover: maybeImageSet(b.coverKey, b.name),
    story: b.story,
    productCount: b._count.products,
  };
}

/* ---------- Orders ---------- */

export const orderRowSelect = {
  id: true,
  number: true,
  customerName: true,
  phone: true,
  region: true,
  totalCents: true,
  paymentMethod: true,
  paymentStatus: true,
  status: true,
  createdAt: true,
  _count: { select: { items: true } },
} satisfies Prisma.OrderSelect;

export function toOrderRow(o: Prisma.OrderGetPayload<{ select: typeof orderRowSelect }>): AdminOrderRow {
  return {
    id: o.id,
    number: o.number,
    customerName: o.customerName,
    phone: o.phone,
    region: o.region,
    totalCents: o.totalCents,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    itemCount: o._count.items,
    createdAt: o.createdAt.toISOString(),
  };
}

/* ---------- Pagination ---------- */

export function paginate<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
