import type { Metadata } from "next";
import { Suspense } from "react";
import type { Paginated, PublicBrandCard, PublicCategory, PublicProductCard } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { apiGet } from "@/lib/api";
import { ShopPagination } from "@/components/store/Pagination";
import { Container, ProductGrid } from "@/components/store/sections";
import { ShopSidebar, ShopToolbar } from "@/components/store/ShopFilters";

const t = getMessages();

type Search = Record<string, string | string[] | undefined>;

const KEYS = ["category", "brand", "min", "max", "inStock", "sort", "page"] as const;

function pick(search: Search) {
  const out: Record<string, string | undefined> = {};
  for (const key of KEYS) {
    const v = search[key];
    out[key] = Array.isArray(v) ? v[0] : v;
  }
  return out;
}

function findCategory(list: PublicCategory[], slug?: string): PublicCategory | undefined {
  for (const c of list) {
    if (c.slug === slug) return c;
    const child = c.children.find((x) => x.slug === slug);
    if (child) return child;
  }
  return undefined;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const params = pick(await searchParams);
  const categories = await apiGet<PublicCategory[]>("/categories");
  const category = findCategory(categories, params.category);
  return {
    title: category ? category.name : t.shop.title,
    description: t.shop.intro,
    alternates: { canonical: category ? `/shop?category=${category.slug}` : "/shop" },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = pick(await searchParams);
  const query = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
  const filtered = ["category", "brand", "min", "max", "inStock", "page"].some((k) => params[k]) || (params.sort && params.sort !== "newest");

  const [result, categories, brands] = await Promise.all([
    // The default listing is cached; filtered combinations go straight to the API so the
    // cache on disk doesn't grow with every possible filter.
    apiGet<Paginated<PublicProductCard>>(`/products?${query}`, filtered ? { revalidate: false } : {}),
    apiGet<PublicCategory[]>("/categories"),
    apiGet<PublicBrandCard[]>("/brands"),
  ]);
  const category = findCategory(categories, params.category);

  return (
    <Container className="pt-10 lg:pt-14">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-5xl leading-none sm:text-6xl">{category?.name ?? t.shop.title}</h1>
        <p className="mt-4 text-[15px] text-ink-soft">{t.shop.intro}</p>
      </header>
      <Suspense>
        <ShopToolbar categories={categories} brands={brands} total={result.total} />
      </Suspense>
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <Suspense>
          <ShopSidebar categories={categories} brands={brands} />
        </Suspense>
        <div>
          {result.items.length === 0 ? (
            <div className="border border-dashed border-line-strong p-10">
              <p className="font-serif text-2xl">{t.shop.empty}</p>
              <p className="mt-2 text-[15px] text-muted">{t.shop.emptyHint}</p>
            </div>
          ) : (
            <ProductGrid products={result.items} priorityCount={3} columns={3} />
          )}
          <ShopPagination page={result.page} pageCount={result.pageCount} basePath="/shop" params={params} />
        </div>
      </div>
    </Container>
  );
}
