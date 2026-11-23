"use client";

import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        title="Add a product"
        back={
          <Link href="/admin/products" className="text-sm text-muted hover:text-ink">
            Products
          </Link>
        }
      />
      <ProductForm product={null} />
    </>
  );
}
