"use client";

import Link from "next/link";
import { use } from "react";
import type { AdminBrand } from "@latelylebanon/shared";
import { BrandForm } from "@/components/admin/BrandForm";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";

export default function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading, reload } = useAdminQuery<AdminBrand>(`/brands/${id}`);

  return (
    <>
      <PageHeader
        title={data?.name ?? "Brand"}
        back={
          <Link href="/admin/brands" className="text-sm text-muted hover:text-ink">
            Brands
          </Link>
        }
        actions={
          data && (
            <Link href={`/admin/products?brandId=${data.id}`} className="text-sm underline underline-offset-4">
              See this brand&apos;s products
            </Link>
          )
        }
      />
      {loading && !data && <LoadingBlock rows={6} />}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {data && <BrandForm key={data.id} brand={data} />}
    </>
  );
}
