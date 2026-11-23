import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import {
  type AdminProduct,
  type AdminProductRow,
  type adminProductListQuerySchema,
  type Paginated,
  type ProductData,
} from "@latelylebanon/shared";
import { badRequest, conflict, notFound } from "../lib/errors";
import { prisma, type Db } from "../lib/prisma";
import { imageSet, maybeImageSet } from "../storage/images";
import { deleteUnusedImages } from "./image-cleanup";
import { refreshWebsite } from "./revalidate";
import { uniqueSlug } from "./slugs";
import { asOptions, asRecord, asStringArray, paginate, toNumber } from "./serializers";

const PAGE_SIZE = 30;

const productSlugTaken = (db: Db, exceptId?: number) => async (slug: string) =>
  Boolean(await db.product.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined }, select: { id: true } }));

/**
 * Checks that variants match the product's options. A product with no options has
 * exactly one default variant; with options, each variant has one value per option.
 * Returns each variant with its display label, for example "M / Olive".
 */
export function normalizeVariants(data: Pick<ProductData, "options" | "variants">) {
  if (data.options.length === 0) {
    if (data.variants.length !== 1) {
      throw badRequest("A product without sizes or colours has exactly one stock row.", {
        variants: "Add sizes or colours, or keep a single stock row",
      });
    }
    return data.variants.map((v) => ({ ...v, options: {}, label: "" }));
  }

  const seen = new Set<string>();
  return data.variants.map((v, index) => {
    const options: Record<string, string> = {};
    for (const option of data.options) {
      const value = v.options[option.name];
      if (!value || !option.values.includes(value)) {
        throw badRequest(`Row ${index + 1} needs a ${option.name.toLowerCase()}.`, {
          [`variants.${index}`]: `Choose a ${option.name.toLowerCase()}`,
        });
      }
      options[option.name] = value;
    }
    const label = data.options.map((o) => options[o.name]).join(" / ");
    if (seen.has(label)) {
      throw badRequest(`"${label}" is listed twice.`, { [`variants.${index}`]: "This combination is listed twice" });
    }
    seen.add(label);
    return { ...v, options, label };
  });
}

async function assertBrandAndCategory(data: ProductData) {
  const [brand, category] = await Promise.all([
    prisma.brand.findUnique({ where: { id: data.brandId }, select: { id: true } }),
    prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }),
  ]);
  if (!brand) throw badRequest("Please choose a brand.", { brandId: "Please choose a brand" });
  if (!category) throw badRequest("Please choose a category.", { categoryId: "Please choose a category" });
}

async function assertSkusFree(variants: { id?: number; sku: string | null }[], productId?: number) {
  const skus = variants.map((v) => v.sku).filter((s): s is string => Boolean(s));
  if (new Set(skus).size !== skus.length) throw badRequest("Each stock code must be different.");
  if (skus.length === 0) return;
  const taken = await prisma.productVariant.findFirst({
    where: { sku: { in: skus }, productId: productId ? { not: productId } : undefined },
    select: { sku: true },
  });
  if (taken) throw conflict(`The stock code "${taken.sku}" is already used by another product.`);
}

function productFields(data: ProductData) {
  return {
    name: data.name,
    brandId: data.brandId,
    categoryId: data.categoryId,
    description: data.description,
    priceCents: data.priceCents,
    compareAtCents: data.compareAtCents ?? null,
    commissionPct: data.commissionPct ?? null,
    status: data.status,
    featured: data.featured,
    tags: data.tags,
    options: data.options,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
  } satisfies Partial<Prisma.ProductUncheckedCreateInput>;
}

export async function listAdminProducts(
  query: z.output<typeof adminProductListQuerySchema>,
): Promise<Paginated<AdminProductRow>> {
  const where: Prisma.ProductWhereInput = {
    status: query.status ?? { not: "ARCHIVED" },
    brandId: query.brandId,
    categoryId: query.categoryId,
    ...(query.q ? { OR: [{ name: { contains: query.q } }, { variants: { some: { sku: { contains: query.q } } } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { select: { stock: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return paginate(
    rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      featured: p.featured,
      priceCents: p.priceCents,
      totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
      image: maybeImageSet(p.images[0]?.key, p.name),
      brand: p.brand,
      category: p.category,
      updatedAt: p.updatedAt.toISOString(),
    })),
    total,
    query.page,
    PAGE_SIZE,
  );
}

export async function getAdminProduct(id: number): Promise<AdminProduct> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });
  if (!p) throw notFound("That product");
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    categoryId: p.categoryId,
    description: p.description,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    commissionPct: toNumber(p.commissionPct),
    status: p.status,
    featured: p.featured,
    tags: asStringArray(p.tags),
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    options: asOptions(p.options),
    variants: p.variants.map((v) => ({
      id: v.id,
      options: asRecord(v.options),
      sku: v.sku,
      priceCents: v.priceCents,
      stock: v.stock,
    })),
    images: p.images.map((i) => imageSet(i.key, i.alt)),
  };
}

export async function createProduct(data: ProductData): Promise<AdminProduct> {
  await assertBrandAndCategory(data);
  const variants = normalizeVariants(data);
  await assertSkusFree(variants);
  const slug = data.slug ?? (await uniqueSlug(data.name, productSlugTaken(prisma)));
  if (data.slug && (await productSlugTaken(prisma)(data.slug))) {
    throw conflict("Another product already uses this web address.", { slug: "Already used by another product" });
  }

  const product = await prisma.product.create({
    data: {
      ...productFields(data),
      slug,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      variants: {
        create: variants.map((v, i) => ({
          options: v.options,
          label: v.label,
          sku: v.sku,
          priceCents: v.priceCents ?? null,
          stock: v.stock,
          sortOrder: i,
        })),
      },
      images: {
        create: data.images.map((img, i) => ({ ...img, alt: img.alt || data.name, sortOrder: i })),
      },
    },
  });
  refreshWebsite("catalog");
  return getAdminProduct(product.id);
}

export async function updateProduct(id: number, data: ProductData): Promise<AdminProduct> {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: { select: { id: true } }, images: { select: { key: true } } },
  });
  if (!existing) throw notFound("That product");
  await assertBrandAndCategory(data);
  const variants = normalizeVariants(data);
  await assertSkusFree(variants, id);

  const slug = data.slug ?? existing.slug;
  if (slug !== existing.slug && (await productSlugTaken(prisma, id)(slug))) {
    throw conflict("Another product already uses this web address.", { slug: "Already used by another product" });
  }

  const existingVariantIds = new Set(existing.variants.map((v) => v.id));
  const keptIds = new Set(variants.flatMap((v) => (v.id && existingVariantIds.has(v.id) ? [v.id] : [])));

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        ...productFields(data),
        slug,
        publishedAt: data.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      },
    });

    await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: [...keptIds] } } });
    for (const [i, v] of variants.entries()) {
      const fields = {
        options: v.options,
        label: v.label,
        sku: v.sku,
        priceCents: v.priceCents ?? null,
        stock: v.stock,
        sortOrder: i,
      };
      if (v.id && keptIds.has(v.id)) await tx.productVariant.update({ where: { id: v.id }, data: fields });
      else await tx.productVariant.create({ data: { ...fields, productId: id } });
    }

    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productImage.createMany({
      data: data.images.map((img, i) => ({ ...img, alt: img.alt || data.name, sortOrder: i, productId: id })),
    });
  });

  const keptKeys = new Set(data.images.map((i) => i.key));
  await deleteUnusedImages(existing.images.map((i) => i.key).filter((k) => !keptKeys.has(k)));
  refreshWebsite("catalog");
  return getAdminProduct(id);
}

/** Copies a product as a hidden draft with the same photos and zero stock. */
export async function duplicateProduct(id: number): Promise<AdminProduct> {
  const p = await getAdminProduct(id);
  const name = `${p.name} (copy)`;
  const copy = await prisma.product.create({
    data: {
      name,
      slug: await uniqueSlug(name, productSlugTaken(prisma)),
      brandId: p.brandId,
      categoryId: p.categoryId,
      description: p.description,
      priceCents: p.priceCents,
      compareAtCents: p.compareAtCents,
      commissionPct: p.commissionPct,
      status: "DRAFT",
      featured: false,
      tags: p.tags,
      options: p.options,
      seoTitle: null,
      seoDescription: p.seoDescription,
      variants: {
        create: p.variants.map((v, i) => ({
          options: v.options,
          label: p.options.map((o) => v.options[o.name] ?? "").join(" / "),
          sku: null,
          priceCents: v.priceCents,
          stock: 0,
          sortOrder: i,
        })),
      },
      images: {
        create: p.images.map((img, i) => ({
          key: img.key,
          alt: img.alt,
          width: img.width,
          height: img.height,
          sortOrder: i,
        })),
      },
    },
  });
  return getAdminProduct(copy.id);
}

/** Products are never deleted, only archived, so past orders keep their links. */
export async function archiveProduct(id: number): Promise<void> {
  const { count } = await prisma.product.updateMany({ where: { id }, data: { status: "ARCHIVED", featured: false } });
  if (count === 0) throw notFound("That product");
  refreshWebsite("catalog");
}
