import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicProductCard } from "@latelylebanon/shared";
import { cn } from "@/lib/cn";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ProductCard } from "./ProductCard";
import { WishlistButton } from "./WishlistButton";

/** Page width container used across the storefront. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}

export function SectionHeading({
  kicker,
  title,
  href,
  linkLabel,
  intro,
}: {
  kicker?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  intro?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-t border-ink pt-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-2">
        {kicker && <p className="label text-terracotta">{kicker}</p>}
        <h2 className="font-serif text-3xl leading-tight sm:text-4xl">{title}</h2>
        {intro && <p className="text-[15px] leading-relaxed text-ink-soft">{intro}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="label link-underline inline-flex items-center gap-2 self-start py-1 sm:self-auto">
          {linkLabel} <ArrowRightIcon className="size-4 flip-rtl" />
        </Link>
      )}
    </div>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
  className,
}: {
  products: PublicProductCard[];
  priorityCount?: number;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4", className)}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} action={<WishlistButton product={p} />} />
        </li>
      ))}
    </ul>
  );
}
