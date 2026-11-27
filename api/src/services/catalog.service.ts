import type { Prisma } from "@prisma/client";
import type {
  HomeData,
  Paginated,
  ProductListQuery,
  PublicBrand,
  PublicCategory,
  PublicProduct,
  PublicProductCard,
  SearchSuggestion,
} from "@latelylebanon/shared";
import { notFound } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { imageSet, maybeImageSet } from "../storage/images";
import {
  asNumberArray,
  asOptions,
  asRecord,
  asStringArray,
  cardInclude,
  paginate,
  priceSummary,
  publicBrandSelect,
  toBrandCard,
  toProductCard,
} from "./serializers";
import { loadSettings } from "./settings.service";
import { variantPrice } from "./pricing";

/** Only published products from visible brands are ever shown on the storefront. */
const visible: Prisma.ProductWhereInput = { status: "PUBLISHED", brand: { isActive: true } };

const newestFirst: Prisma.ProductOrderByWithRelationInput[] = [{ publishedAt: "desc" }, { id: "desc" }];

async function cards(where: Prisma.ProductWhereInput, take: number, orderBy = newestFirst) {
  const rows = await prisma.product.findMany({ where: { ...visible, ...where }, include: cardInclude, orderBy, take });
  return rows.map(toProductCard);
}

async function categoryAndChildrenIds(slug: string): Promise<number[] | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, children: { select: { id: true } } },
  });
  return category ? [category.id, ...category.children.map((c) => c.id)] : null;
}

export async function listProducts(query: ProductListQuery): Promise<Paginated<PublicProductCard>> {
  const and: Prisma.ProductWhereInput[] = [visible];

  if (query.category) {
    const ids = await categoryAndChildrenIds(query.category);
    and.push({ categoryId: { in: ids ?? [] } });
  }
  if (query.brand) {
    and.push({ brand: { slug: { in: query.brand.split(",").filter(Boolean) } } });
  }
  if (query.min != null) and.push({ priceCents: { gte: Math.round(query.min * 100) } });
  if (query.max != null) and.push({ priceCents: { lte: Math.round(query.max * 100) } });
  if (query.inStock) and.push({ variants: { some: { stock: { gt: 0 } } } });
  if (query.q) {
    and.push({
      OR: [
        { name: { contains: query.q } },
        { description: { contains: query.q } },
        { brand: { name: { contains: query.q } } },
        { category: { name: { contains: query.q } } },
      ],
    });
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    query.sort === "price-asc"
      ? [{ priceCents: "asc" }, { id: "desc" }]
      : query.sort === "price-desc"
        ? [{ priceCents: "desc" }, { id: "desc" }]
        : query.sort === "name"
          ? [{ name: "asc" }]
          : newestFirst;

  const where = { AND: and };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: cardInclude,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);
  return paginate(rows.map(toProductCard), total, query.page, query.limit);
}

export async function getProduct(slug: string): Promise<PublicProduct> {
  const p = await prisma.product.findFirst({
    where: { ...visible, slug },
    include: {
      brand: { select: { name: true, slug: true, story: true, logoKey: true } },
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });
  if (!p) throw notFound("That product");

  const sameCategory = await cards({ categoryId: p.categoryId, id: { not: p.id } }, 4);
  const related =
    sameCategory.length >= 4
      ? sameCategory
      : [
          ...sameCategory,
          ...(await cards(
            { brandId: p.brandId, id: { notIn: [p.id, ...sameCategory.map((c) => c.id)] } },
            4 - sameCategory.length,
          )),
        ];

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    ...priceSummary(p),
    compareAtCents: p.compareAtCents,
    inStock: p.variants.some((v) => v.stock > 0),
    description: p.description,
    weightGrams: p.weightGrams,
    tags: asStringArray(p.tags),
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    options: asOptions(p.options),
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      options: asRecord(v.options),
      priceCents: variantPrice(p.priceCents, v.priceCents),
      stock: v.stock,
    })),
    images: p.images.map((i) => imageSet(i.key, i.alt || p.name)),
    brand: {
      name: p.brand.name,
      slug: p.brand.slug,
      story: p.brand.story,
      logo: maybeImageSet(p.brand.logoKey, `${p.brand.name} logo`),
    },
    category: p.category,
    related,
    createdAt: (p.publishedAt ?? p.createdAt).toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function listBrands() {
  const rows = await prisma.brand.findMany({
    where: { isActive: true },
    select: publicBrandSelect,
    orderBy: { name: "asc" },
  });
  return rows.map(toBrandCard);
}

export async function getBrand(slug: string): Promise<PublicBrand & { products: PublicProductCard[] }> {
  const b = await prisma.brand.findFirst({ where: { slug, isActive: true }, select: publicBrandSelect });
  if (!b) throw notFound("That brand");
  return {
    ...toBrandCard(b),
    instagramUrl: b.instagramUrl,
    products: await cards({ brandId: b.id }, 200),
  };
}

export async function listCategories(): Promise<PublicCategory[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: visible } } } },
  });
  const toPublic = (c: (typeof rows)[number]): PublicCategory => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: maybeImageSet(c.imageKey, c.name),
    parentId: c.parentId,
    productCount: c._count.products,
    children: rows.filter((child) => child.parentId === c.id).map(toPublic),
  });
  return rows.filter((c) => c.parentId == null).map(toPublic);
}

/** Keeps the admin's chosen order for featured items. */
function inOrder<T extends { id: number }>(ids: number[], items: T[]): T[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export async function getHome(): Promise<HomeData> {
  const settings = await loadSettings();
  const brandIds = asNumberArray(settings.featuredBrandIds);
  const productIds = asNumberArray(settings.featuredProductIds);

  const [brandRows, featured, newArrivals, categories] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true, ...(brandIds.length ? { id: { in: brandIds } } : {}) },
      select: publicBrandSelect,
      orderBy: { createdAt: "asc" },
      take: brandIds.length || 4,
    }),
    productIds.length ? cards({ id: { in: productIds } }, productIds.length) : cards({ featured: true }, 8),
    cards({}, 8),
    listCategories(),
  ]);

  const shown = new Set([...featured, ...newArrivals].map((p) => p.id));
  const galleryPool = await cards({ id: { notIn: [...shown] } }, 6, [{ updatedAt: "desc" }]);
  const gallery = galleryPool.length >= 6 ? galleryPool : [...galleryPool, ...newArrivals].slice(0, 6);

  return {
    featuredBrands: (brandIds.length ? inOrder(brandIds, brandRows) : brandRows).map(toBrandCard),
    featuredProducts: productIds.length ? inOrder(productIds, featured) : featured,
    newArrivals,
    categories,
    gallery,
  };
}

export async function searchSuggestions(q: string): Promise<SearchSuggestion> {
  const term = q.trim();
  if (term.length < 2) return { products: [], brands: [] };
  const [products, brands] = await Promise.all([
    cards(
      {
        OR: [
          { name: { contains: term } },
          { brand: { name: { contains: term } } },
          { category: { name: { contains: term } } },
        ],
      },
      6,
    ),
    prisma.brand.findMany({
      where: { isActive: true, name: { contains: term } },
      select: { name: true, slug: true },
      take: 4,
    }),
  ]);
  return { products, brands };
}

/** Slugs and dates for sitemap.xml. */
export async function sitemapEntries() {
  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({ where: visible, select: { slug: true, updatedAt: true } }),
    prisma.brand.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  const map = (rows: { slug: string; updatedAt: Date }[]) =>
    rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() }));
  return { products: map(products), brands: map(brands), categories: map(categories) };
}

export async function listDeliveryZones() {
  return prisma.deliveryZone.findMany({
    where: { isActive: true },
    select: { id: true, name: true, feeCents: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
