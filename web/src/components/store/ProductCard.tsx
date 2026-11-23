import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicProductCard } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/cn";
import { Price } from "./Price";

interface ProductCardProps {
  product: PublicProductCard;
  /** Extra controls placed over the photo, for example the save button. */
  action?: ReactNode;
  /** Load the photo eagerly for cards visible on first paint. */
  priority?: boolean;
  /** Used by the admin preview: no link, no hover photo. */
  preview?: boolean;
  sizes?: string;
}

export function ProductCard({
  product,
  action,
  priority,
  preview,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
}: ProductCardProps) {
  const t = getMessages();
  const onSale = product.compareAtCents != null && product.compareAtCents > product.priceCents;

  const body = (
    <>
      <div className="relative aspect-4/5 overflow-hidden bg-sand-deep">
        {product.image ? (
          <>
            <Image
              src={product.image.lg}
              alt={product.image.alt || product.name}
              fill
              sizes={sizes}
              priority={priority}
              className={cn(
                "object-cover transition-opacity duration-500",
                product.hoverImage && !preview && "group-hover:opacity-0",
              )}
            />
            {product.hoverImage && !preview && (
              <Image
                src={product.hoverImage.lg}
                alt=""
                fill
                sizes={sizes}
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted">{product.name}</div>
        )}
        <div className="absolute top-0 left-0 flex gap-px rtl:right-0 rtl:left-auto">
          {!product.inStock && <span className="label bg-ink px-2 py-1 text-paper">{t.common.soldOut}</span>}
          {product.inStock && onSale && <span className="label bg-terracotta px-2 py-1 text-paper">{t.common.sale}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1 pt-3">
        <span className="label text-muted">{product.brand.name}</span>
        <span className="font-serif text-lg leading-snug text-ink">
          <span className={cn(!preview && "link-underline")}>{product.name}</span>
        </span>
        <Price
          cents={product.priceCents}
          compareAtCents={product.compareAtCents}
          fromLabel={product.priceVaries ? t.common.from : undefined}
          className="text-sm"
        />
      </div>
    </>
  );

  return (
    <article className="group relative">
      {preview ? body : <Link href={`/products/${product.slug}`} className="block focus-visible:outline-offset-4">{body}</Link>}
      {action && <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2">{action}</div>}
    </article>
  );
}
