"use client";

import Link from "next/link";
import { use } from "react";
import type { AdminProduct } from "@latelylebanon/shared";
import { ProductForm } from "@/components/admin/ProductForm";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading, reload } = useAdminQuery<AdminProduct>(`/products/${id}`);

  return (
    <>
      <PageHeader
        title={data?.name ?? "Product"}
        back={
          <Link href="/admin/products" className="text-sm text-muted hover:text-ink">
            Products
          </Link>
        }
      />
      {loading && !data && <LoadingBlock rows={6} />}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {data && <ProductForm key={data.id} product={data} />}
    </>
  );
}
