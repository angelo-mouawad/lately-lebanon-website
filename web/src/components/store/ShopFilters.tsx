"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { PRODUCT_SORTS, type ProductSort, type PublicBrandCard, type PublicCategory } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Checkbox, Select } from "@/components/ui/Field";

const t = getMessages();

/** Reads and writes shop filters in the URL so filtered pages can be shared. */
function useFilterUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  return { params, update, pending };
}

function FilterPanel({ categories, brands, onDone }: { categories: PublicCategory[]; brands: PublicBrandCard[]; onDone?: () => void }) {
  const { params, update } = useFilterUrl();
  const category = params.get("category") ?? "";
  const selectedBrands = (params.get("brand") ?? "").split(",").filter(Boolean);
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  function toggleBrand(slug: string) {
    const next = selectedBrands.includes(slug) ? selectedBrands.filter((s) => s !== slug) : [...selectedBrands, slug];
    update({ brand: next.join(",") || null });
  }

  function applyPrice(e: FormEvent) {
    e.preventDefault();
    update({ min: min || null, max: max || null });
    onDone?.();
  }

  const categoryLink = (slug: string, label: string, count?: number, indent = false) => (
    <li key={slug || "all"}>
      <button
        type="button"
        onClick={() => {
          update({ category: slug || null });
          onDone?.();
        }}
        aria-pressed={category === slug}
        className={cn(
          "flex w-full items-baseline justify-between py-1.5 text-left text-[15px] hover:text-terracotta",
          indent && "pl-4",
          category === slug && "font-medium text-terracotta",
        )}
      >
        <span>{label}</span>
        {count != null && <span className="text-xs text-muted tabular-nums">{count}</span>}
      </button>
    </li>
  );

  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="label mb-3 text-muted">{t.shop.category}</legend>
        <ul>
          {categoryLink("", t.nav.allProducts)}
          {categories.map((c) => [
            categoryLink(c.slug, c.name, c.productCount),
            ...c.children.map((child) => categoryLink(child.slug, child.name, child.productCount, true)),
          ])}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="label mb-3 text-muted">{t.shop.brand}</legend>
        <div className="flex flex-col gap-2.5">
          {brands.map((b) => (
            <Checkbox key={b.slug} label={b.name} checked={selectedBrands.includes(b.slug)} onChange={() => toggleBrand(b.slug)} />
          ))}
        </div>
      </fieldset>

      <form onSubmit={applyPrice}>
        <fieldset>
          <legend className="label mb-3 text-muted">{t.shop.price}</legend>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="price-min">
              {t.shop.min}
            </label>
            <input
              id="price-min"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={`$ ${t.shop.min}`}
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="h-10 w-full border border-line-strong bg-paper px-2.5 text-sm tabular-nums focus:border-ink focus:outline-none"
            />
            <span aria-hidden className="text-muted">to</span>
            <label className="sr-only" htmlFor="price-max">
              {t.shop.max}
            </label>
            <input
              id="price-max"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={`$ ${t.shop.max}`}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="h-10 w-full border border-line-strong bg-paper px-2.5 text-sm tabular-nums focus:border-ink focus:outline-none"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="mt-3">
            {t.shop.applyFilters}
          </Button>
        </fieldset>
      </form>

      <Checkbox
        label={t.shop.inStockOnly}
        checked={params.get("inStock") === "1"}
        onChange={(e) => update({ inStock: e.target.checked ? "1" : null })}
      />
    </div>
  );
}

export function ShopToolbar({
  categories,
  brands,
  total,
}: {
  categories: PublicCategory[];
  brands: PublicBrandCard[];
  total: number;
}) {
  const { params, update, pending } = useFilterUrl();
  const [open, setOpen] = useState(false);
  const sort = (params.get("sort") as ProductSort | null) ?? "newest";
  const hasFilters = ["category", "brand", "min", "max", "inStock", "q"].some((k) => params.get(k));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setOpen(true)} className="label border border-ink px-4 py-2.5 lg:hidden">
            {t.shop.filters}
          </button>
          <p className={cn("text-sm text-muted tabular-nums", pending && "opacity-50")} aria-live="polite">
            {total === 1 ? t.shop.resultsOne : t.shop.results.replace("{count}", String(total))}
          </p>
          {hasFilters && (
            <button
              type="button"
              className="text-sm underline underline-offset-4"
              onClick={() => update({ category: null, brand: null, min: null, max: null, inStock: null, q: null })}
            >
              {t.shop.clearFilters}
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">{t.shop.sort}</span>
          <Select value={sort} onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })} className="h-10 w-48">
            {PRODUCT_SORTS.map((s) => (
              <option key={s} value={s}>
                {t.shop.sortOptions[s]}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title={t.shop.filters} side="left" closeLabel={t.nav.close}>
        <div className="p-5">
          <FilterPanel categories={categories} brands={brands} onDone={() => setOpen(false)} />
        </div>
      </Drawer>
    </>
  );
}

export function ShopSidebar({ categories, brands }: { categories: PublicCategory[]; brands: PublicBrandCard[] }) {
  return (
    <aside className="hidden lg:block" aria-label={t.shop.filters}>
      <div className="sticky top-28">
        <FilterPanel categories={categories} brands={brands} />
      </div>
    </aside>
  );
}
