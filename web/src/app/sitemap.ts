import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";
import { SITE_URL } from "@/lib/config";

interface Entries {
  products: { slug: string; updatedAt: string }[];
  brands: { slug: string; updatedAt: string }[];
  categories: { slug: string; updatedAt: string }[];
}

const STATIC_PAGES = ["", "/shop", "/brands", "/about", "/contact", "/faq", "/track", "/returns", "/terms", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await apiGet<Entries>("/sitemap");
  return [
    ...STATIC_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: path === "" || path === "/shop" ? ("daily" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.6,
    })),
    ...data.categories.map((c) => ({ url: `${SITE_URL}/shop?category=${c.slug}`, lastModified: c.updatedAt, priority: 0.7 })),
    ...data.brands.map((b) => ({ url: `${SITE_URL}/brands/${b.slug}`, lastModified: b.updatedAt, priority: 0.7 })),
    ...data.products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
  ];
}
