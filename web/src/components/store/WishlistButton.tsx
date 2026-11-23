"use client";

import type { PublicProductCard } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/cn";
import { toggleWishlist, useWishlist } from "@/lib/shop-stores";
import { HeartIcon } from "@/components/ui/icons";

const t = getMessages();

export function WishlistButton({ product, variant = "icon" }: { product: PublicProductCard; variant?: "icon" | "text" }) {
  const saved = useWishlist().some((p) => p.id === product.id);

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={() => toggleWishlist(product)}
        aria-pressed={saved}
        className="inline-flex h-14 items-center justify-center gap-2 border border-ink px-5 text-sm tracking-wide hover:bg-ink hover:text-paper"
      >
        <HeartIcon className="size-5" filled={saved} />
        {saved ? t.product.saved : t.product.save}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(product)}
      aria-pressed={saved}
      aria-label={`${saved ? t.product.saved : t.product.save}: ${product.name}`}
      className={cn(
        "flex size-9 items-center justify-center bg-paper/90 transition-colors hover:bg-paper",
        saved ? "text-terracotta" : "text-ink",
      )}
    >
      <HeartIcon className="size-[18px]" filled={saved} />
    </button>
  );
}
