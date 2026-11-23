"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  formatUSD,
  type AdminBrandRow,
  type AdminCategory,
  type AdminProductRow,
  type Paginated,
  type ProductStatus,
} from "@latelylebanon/shared";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader, Pagination } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";

const STATUS: Record<ProductStatus, { label: string; tone: BadgeTone }> = {
  PUBLISHED: { label: "On website", tone: "olive" },
  DRAFT: { label: "Hidden", tone: "neutral" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingBlock rows={6} />}>
      <ProductsList />
    </Suspense>
  );
}

function ProductsList() {
  const initial = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [brandId, setBrandId] = useState(initial.get("brandId") ?? "");
  const [categoryId, setCategoryId] = useState(initial.get("categoryId") ?? "");
  const [page, setPage] = useState(1);
  const search = useDebounced(q);

  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("q", search);
  if (status) params.set("status", status);
  if (brandId) params.set("brandId", brandId);
  if (categoryId) params.set("categoryId", categoryId);

  const { data, error, loading, reload } = useAdminQuery<Paginated<AdminProductRow>>(`/products?${params}`);
  const brands = useAdminQuery<AdminBrandRow[]>("/brands");
  const categories = useAdminQuery<AdminCategory[]>("/categories");

  const filter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything in the shop. Click a product to change it."
        actions={<ButtonLink href="/admin/products/new">Add a product</ButtonLink>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input aria-label="Search products" placeholder="Search by name" value={q} onChange={(e) => filter(setQ)(e.target.value)} />
        <Select aria-label="Show on website" value={status} onChange={(e) => filter(setStatus)(e.target.value)}>
          <option value="">All except archived</option>
          <option value="PUBLISHED">On website</option>
          <option value="DRAFT">Hidden</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Select aria-label="Brand" value={brandId} onChange={(e) => filter(setBrandId)(e.target.value)}>
          <option value="">All brands</option>
          {brands.data?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Category" value={categoryId} onChange={(e) => filter(setCategoryId)(e.target.value)}>
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {error && <ErrorBlock message={error} onRetry={reload} />}
      {loading && !data && <LoadingBlock rows={6} />}

      {data && data.items.length === 0 && (
        <EmptyBlock title={q || status || brandId || categoryId ? "No products match." : "No products yet."}>
          <ButtonLink href="/admin/products/new" variant="secondary" size="sm">
            Add a product
          </ButtonLink>
        </EmptyBlock>
      )}

      {data && data.items.length > 0 && (
        <>
          <p className="mb-2 text-sm text-muted tabular-nums">
            {data.total} {data.total === 1 ? "product" : "products"}
          </p>
          <ul className={`divide-y divide-line border border-line bg-paper ${loading ? "opacity-60" : ""}`}>
            {data.items.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 p-3 hover:bg-sand sm:p-4">
                  <div className="relative aspect-4/5 w-14 shrink-0 bg-sand-deep">
                    {p.image && <Image src={p.image.sm} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-sm text-muted">
                      {p.brand.name} · {p.category.name}
                    </p>
                  </div>
                  <div className="hidden w-24 text-right tabular-nums sm:block">{formatUSD(p.priceCents)}</div>
                  <div className={`hidden w-24 text-right text-sm tabular-nums sm:block ${p.totalStock === 0 ? "text-danger" : ""}`}>
                    {p.totalStock === 0 ? "Sold out" : `${p.totalStock} in stock`}
                  </div>
                  <div className="flex w-28 justify-end">
                    <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />
        </>
      )}
    </>
  );
}
