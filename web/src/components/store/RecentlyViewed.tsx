"use client";

import { useEffect } from "react";
import type { PublicProductCard } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { rememberViewed, useRecent } from "@/lib/shop-stores";
import { ProductGrid, SectionHeading } from "./sections";

const t = getMessages();

/** Shows recently viewed products, and records the current one when `current` is given. */
export function RecentlyViewed({ current }: { current?: PublicProductCard }) {
  const recent = useRecent();

  useEffect(() => {
    if (current) rememberViewed(current);
  }, [current]);

  const items = recent.filter((p) => p.id !== current?.id).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="pt-20">
      <SectionHeading title={t.product.recentlyViewed} />
      <ProductGrid products={items} />
    </section>
  );
}
