"use client";

import { useMemo, useState } from "react";
import { formatUSD, type PublicProduct, type PublicProductCard } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { cn } from "@/lib/cn";
import { addToCart, bagDrawer } from "@/lib/shop-stores";
import { whatsappShareLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { QuantityStepper } from "./CartLines";
import { Price } from "./Price";
import { WishlistButton } from "./WishlistButton";

const t = getMessages();

/**
 * Variant picker, quantity and add to bag. Price and stock follow the chosen options.
 * Choices that are sold out in every combination are crossed out.
 */
export function ProductPurchase({
  product,
  card,
  freeDeliveryThresholdCents,
}: {
  product: PublicProduct;
  card: PublicProductCard;
  freeDeliveryThresholdCents: number | null;
}) {
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(
    product.options.length ? { ...(firstInStock?.options ?? {}) } : {},
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () => product.variants.find((v) => product.options.every((o) => v.options[o.name] === selected[o.name])),
    [product, selected],
  );

  function isPossible(optionName: string, value: string) {
    return product.variants.some(
      (v) =>
        v.stock > 0 &&
        v.options[optionName] === value &&
        product.options.every((o) => o.name === optionName || !selected[o.name] || v.options[o.name] === selected[o.name]),
    );
  }

  const stock = variant?.stock ?? 0;
  const price = variant?.priceCents ?? product.priceCents;

  function add() {
    if (!variant || stock === 0) return;
    addToCart(
      {
        variantId: variant.id,
        productName: product.name,
        productSlug: product.slug,
        brandName: product.brand.name,
        variantLabel: variant.label,
        priceCents: variant.priceCents,
        imageUrl: product.images[0]?.sm ?? null,
        maxQuantity: variant.stock,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    bagDrawer.open();
  }

  return (
    <div className="flex flex-col gap-6">
      <Price cents={price} compareAtCents={product.compareAtCents} className="text-xl" />

      {product.options.map((option) => (
        <fieldset key={option.name}>
          <legend className="label mb-3">
            {option.name}
            {selected[option.name] && <span className="ml-2 font-normal tracking-normal normal-case text-muted">{selected[option.name]}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const active = selected[option.name] === value;
              const possible = isPossible(option.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelected((s) => ({ ...s, [option.name]: value }));
                    setQuantity(1);
                  }}
                  className={cn(
                    "h-11 min-w-12 border px-4 text-sm transition-colors",
                    active ? "border-ink bg-ink text-paper" : "border-line-strong hover:border-ink",
                    !possible && !active && "text-muted line-through decoration-1",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <p className={cn("text-sm", stock === 0 ? "text-danger" : stock <= 3 ? "text-terracotta" : "text-olive")} aria-live="polite">
        {!variant ? fmt(t.product.choose, { option: product.options[0]?.name.toLowerCase() ?? "" }) : stock === 0 ? t.product.soldOut : stock <= 3 ? fmt(t.common.lowStock, { count: stock }) : t.product.inStock}
      </p>

      <div className="flex flex-wrap items-stretch gap-2">
        {stock > 0 && (
          <QuantityStepper value={quantity} max={Math.min(20, stock)} onChange={setQuantity} label={t.product.quantity} />
        )}
        <Button size="lg" onClick={add} disabled={!variant || stock === 0} className="h-14 flex-1">
          {stock === 0 && variant ? t.product.soldOut : added ? t.product.added : `${t.product.addToBag}  ${formatUSD(price * quantity)}`}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <WishlistButton product={card} variant="text" />
        <a
          href={whatsappShareLink(`${fmt(t.product.shareText, { name: product.name })} ${SITE_URL}/products/${product.slug}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-14 items-center justify-center gap-2 border border-ink px-5 text-sm tracking-wide hover:bg-ink hover:text-paper"
        >
          <WhatsAppIcon className="size-5" />
          {t.product.share}
        </a>
      </div>

      <div className="border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
        <p>{t.product.deliveryLine}</p>
        {freeDeliveryThresholdCents != null && (
          <p>{fmt(t.product.freeDeliveryLine, { amount: formatUSD(freeDeliveryThresholdCents) })}</p>
        )}
      </div>
    </div>
  );
}
