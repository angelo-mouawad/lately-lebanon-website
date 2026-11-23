import type { AdminProduct, ImageSet, ProductStatus } from "@latelylebanon/shared";

export interface OptionDraft {
  name: string;
  values: string[];
}

export interface VariantDraft {
  id?: number;
  options: Record<string, string>;
  sku: string;
  priceCents: number | null;
  stock: number | null;
}

export interface ProductDraft {
  name: string;
  slug: string;
  brandId: number | null;
  categoryId: number | null;
  description: string;
  priceCents: number | null;
  compareAtCents: number | null;
  commissionPct: number | null;
  status: ProductStatus;
  featured: boolean;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  options: OptionDraft[];
  variants: VariantDraft[];
  images: ImageSet[];
}

export const emptyDraft: ProductDraft = {
  name: "",
  slug: "",
  brandId: null,
  categoryId: null,
  description: "",
  priceCents: null,
  compareAtCents: null,
  commissionPct: null,
  status: "DRAFT",
  featured: false,
  tags: "",
  seoTitle: "",
  seoDescription: "",
  options: [],
  variants: [{ options: {}, sku: "", priceCents: null, stock: 0 }],
  images: [],
};

export function draftFromProduct(p: AdminProduct): ProductDraft {
  return {
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    categoryId: p.categoryId,
    description: p.description,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    commissionPct: p.commissionPct,
    status: p.status,
    featured: p.featured,
    tags: p.tags.join(", "),
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    options: p.options,
    variants: p.variants.map((v) => ({ ...v, sku: v.sku ?? "" })),
    images: p.images,
  };
}

/** Converts the form into the API payload. Empty optional fields become null. */
export function draftToInput(d: ProductDraft) {
  return {
    name: d.name,
    slug: d.slug || null,
    brandId: d.brandId,
    categoryId: d.categoryId,
    description: d.description,
    priceCents: d.priceCents,
    compareAtCents: d.compareAtCents,
    commissionPct: d.commissionPct,
    status: d.status,
    featured: d.featured,
    tags: d.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
    options: d.options.map((o) => ({ name: o.name.trim(), values: o.values })),
    variants: d.variants.map((v) => ({
      id: v.id,
      options: v.options,
      sku: v.sku || null,
      priceCents: v.priceCents,
      stock: v.stock,
    })),
    images: d.images.map((i) => ({ key: i.key, alt: i.alt, width: i.width, height: i.height })),
  };
}

export const variantLabel = (options: OptionDraft[], values: Record<string, string>) =>
  options.map((o) => values[o.name] ?? "").join(" / ");

function combinations(options: OptionDraft[]): Record<string, string>[] {
  const usable = options.filter((o) => o.name.trim() && o.values.length > 0);
  return usable.reduce<Record<string, string>[]>(
    (rows, option) => rows.flatMap((row) => option.values.map((value) => ({ ...row, [option.name]: value }))),
    [{}],
  );
}

/**
 * Rebuilds the stock rows after sizes or colours change: one row per combination.
 * Rows that still exist keep their stock, price and id.
 */
export function syncVariants(options: OptionDraft[], current: VariantDraft[]): VariantDraft[] {
  const usable = options.filter((o) => o.name.trim() && o.values.length > 0);
  if (usable.length === 0) {
    const first = current[0];
    return [{ id: first?.id, options: {}, sku: first?.sku ?? "", priceCents: null, stock: first?.stock ?? 0 }];
  }
  const keyOf = (values: Record<string, string>) => usable.map((o) => `${o.name}=${values[o.name] ?? ""}`).join("|");
  const existing = new Map(current.map((v) => [keyOf(v.options), v]));

  return combinations(usable).map((values) => {
    const match = existing.get(keyOf(values));
    if (match) {
      return { ...match, options: values };
    }
    return { options: values, sku: "", priceCents: null, stock: 0 };
  });
}

export const OPTION_SUGGESTIONS = ["Size", "Colour", "Scent", "Weight", "Material"];
