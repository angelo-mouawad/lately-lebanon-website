import type { Metadata } from "next";
import type { Paginated, PublicProductCard } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { apiGet } from "@/lib/api";
import { ButtonLink } from "@/components/ui/Button";
import { ShopPagination } from "@/components/store/Pagination";
import { SearchForm } from "@/components/store/SearchForm";
import { Container, ProductGrid } from "@/components/store/sections";

const t = getMessages();

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const q = first((await searchParams).q).trim();
  return { title: q ? fmt(t.search.resultsFor, { q }) : t.search.title, robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const q = first(params.q).trim().slice(0, 100);
  const page = first(params.page) || "1";
  const result = q
    ? await apiGet<Paginated<PublicProductCard>>(`/products?q=${encodeURIComponent(q)}&page=${encodeURIComponent(page)}`, {
        revalidate: false,
      })
    : null;

  return (
    <Container className="pt-10 lg:pt-14">
      <h1 className="mb-6 font-serif text-5xl leading-none">{q ? fmt(t.search.resultsFor, { q }) : t.search.title}</h1>
      <div className="mb-10 max-w-xl">
        <SearchForm initial={q} />
      </div>
      {result && result.items.length === 0 && (
        <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong p-10">
          <p className="font-serif text-2xl">{fmt(t.search.noResults, { q })}</p>
          <p className="text-[15px] text-muted">{t.search.noResultsHint}</p>
          <ButtonLink href="/shop" variant="secondary">
            {t.nav.allProducts}
          </ButtonLink>
        </div>
      )}
      {result && result.items.length > 0 && (
        <>
          <p className="mb-6 text-sm text-muted tabular-nums">
            {result.total === 1 ? t.shop.resultsOne : fmt(t.shop.results, { count: result.total })}
          </p>
          <ProductGrid products={result.items} />
          <ShopPagination page={result.page} pageCount={result.pageCount} basePath="/search" params={{ q }} />
        </>
      )}
    </Container>
  );
}
