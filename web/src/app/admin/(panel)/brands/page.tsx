"use client";

import Image from "next/image";
import Link from "next/link";
import type { AdminBrandRow } from "@latelylebanon/shared";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";

export default function BrandsPage() {
  const { data, error, loading, reload } = useAdminQuery<AdminBrandRow[]>("/brands");

  return (
    <>
      <PageHeader
        title="Brands"
        description="Our partner brands. Each brand has a page on the website with its story and products."
        actions={<ButtonLink href="/admin/brands/new">Add a brand</ButtonLink>}
      />
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {loading && !data && <LoadingBlock />}
      {data && data.length === 0 && (
        <EmptyBlock title="No brands yet.">
          <ButtonLink href="/admin/brands/new" variant="secondary" size="sm">
            Add the first brand
          </ButtonLink>
        </EmptyBlock>
      )}
      {data && data.length > 0 && (
        <ul className="divide-y divide-line border border-line bg-paper">
          {data.map((b) => (
            <li key={b.id}>
              <Link href={`/admin/brands/${b.id}`} className="flex items-center gap-4 p-3 hover:bg-sand sm:p-4">
                <div className="relative size-12 shrink-0 border border-line bg-sand-deep">
                  {b.logo && <Image src={b.logo.sm} alt="" fill sizes="48px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.name}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {b.productCount} {b.productCount === 1 ? "product" : "products"} · {b.commissionPct}% commission
                    {b.ownDelivery && " · Own delivery"}
                  </p>
                </div>
                <Badge tone={b.isActive ? "olive" : "neutral"}>{b.isActive ? "On website" : "Hidden"}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
