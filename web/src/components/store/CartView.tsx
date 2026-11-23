"use client";

import { getMessages } from "@/i18n";
import { usePromo } from "@/lib/shop-stores";
import { ButtonLink } from "@/components/ui/Button";
import { CartLines, FreeDeliveryNote } from "./CartLines";
import { PromoField, Totals } from "./OrderSummary";
import { useQuote } from "./use-quote";

const t = getMessages();

export function CartView() {
  const promoCode = usePromo();
  const { lines, quote } = useQuote({ promoCode: promoCode || null });

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong p-10">
        <p className="font-serif text-2xl">{t.cart.empty}</p>
        <p className="text-[15px] text-muted">{t.cart.emptyHint}</p>
        <ButtonLink href="/shop" variant="secondary">
          {t.cart.continue}
        </ButtonLink>
      </div>
    );
  }

  const hasUnavailable = quote?.lines.some((l) => !l.available) ?? false;

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="border-t border-ink lg:col-span-7">
        <CartLines lines={lines} quote={quote} />
      </div>
      <aside className="flex flex-col gap-6 lg:col-span-4 lg:col-start-9">
        <div className="flex flex-col gap-6 border border-line bg-paper p-6 lg:sticky lg:top-28">
          <FreeDeliveryNote quote={quote} />
          <PromoField quote={quote} />
          <Totals quote={quote} zoneChosen={false} />
          <ButtonLink href="/checkout" size="lg" block aria-disabled={hasUnavailable} className={hasUnavailable ? "pointer-events-none opacity-50" : ""}>
            {t.cart.checkout}
          </ButtonLink>
          <ButtonLink href="/shop" variant="ghost" block>
            {t.cart.continue}
          </ButtonLink>
        </div>
      </aside>
    </div>
  );
}
