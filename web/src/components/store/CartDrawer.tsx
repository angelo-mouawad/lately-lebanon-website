"use client";

import { formatUSD } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { bagDrawer, cartCount, useBagDrawerOpen } from "@/lib/shop-stores";
import { ButtonLink } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { CartLines, FreeDeliveryNote } from "./CartLines";
import { useQuote } from "./use-quote";

const t = getMessages();

export function CartDrawer() {
  const open = useBagDrawerOpen();
  const { lines, quote } = useQuote({ enabled: open });
  const close = () => bagDrawer.close();
  const subtotal = quote?.subtotalCents ?? lines.reduce((s, l) => s + l.priceCents * l.quantity, 0);

  return (
    <Drawer
      open={open}
      onClose={close}
      title={`${t.cart.title} (${cartCount(lines)})`}
      closeLabel={t.nav.close}
      footer={
        lines.length > 0 && (
          <div className="flex flex-col gap-4">
            <FreeDeliveryNote quote={quote} />
            <div className="flex items-baseline justify-between">
              <span className="label">{t.cart.subtotal}</span>
              <span className="text-lg tabular-nums">{formatUSD(subtotal)}</span>
            </div>
            <p className="text-sm text-muted">
              {t.cart.delivery}: {t.cart.deliveryAtCheckout}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href="/cart" variant="secondary" onClick={close}>
                {t.cart.viewBag}
              </ButtonLink>
              <ButtonLink href="/checkout" onClick={close}>
                {t.cart.checkout}
              </ButtonLink>
            </div>
          </div>
        )
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-start gap-4 p-5">
          <p className="font-serif text-2xl">{t.cart.empty}</p>
          <p className="text-[15px] text-muted">{t.cart.emptyHint}</p>
          <ButtonLink href="/shop" variant="secondary" onClick={close}>
            {t.cart.continue}
          </ButtonLink>
        </div>
      ) : (
        <div className="px-5">
          <CartLines lines={lines} quote={quote} compact onNavigate={close} />
        </div>
      )}
    </Drawer>
  );
}
