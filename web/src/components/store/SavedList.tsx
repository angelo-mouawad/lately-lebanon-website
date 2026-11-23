"use client";

import { getMessages } from "@/i18n";
import { useWishlist } from "@/lib/shop-stores";
import { ButtonLink } from "@/components/ui/Button";
import { RecentlyViewed } from "./RecentlyViewed";
import { ProductGrid } from "./sections";

const t = getMessages();

export function SavedList() {
  const saved = useWishlist();

  return (
    <>
      {saved.length === 0 ? (
        <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong p-10">
          <p className="font-serif text-2xl">{t.wishlist.empty}</p>
          <p className="text-[15px] text-muted">{t.wishlist.emptyHint}</p>
          <ButtonLink href="/shop" variant="secondary">
            {t.cart.continue}
          </ButtonLink>
        </div>
      ) : (
        <ProductGrid products={saved} />
      )}
      <RecentlyViewed />
    </>
  );
}
