"use client";

import Link from "next/link";
import { BrandForm } from "@/components/admin/BrandForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewBrandPage() {
  return (
    <>
      <PageHeader
        title="Add a brand"
        back={
          <Link href="/admin/brands" className="text-sm text-muted hover:text-ink">
            Brands
          </Link>
        }
      />
      <BrandForm brand={null} />
    </>
  );
}
