"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatLebanesePhone, whatsappNumbers, type StoreSettings, type TrackedOrder } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { publicFetch } from "@/lib/public-api";
import { clearCart, lastOrderStore, promoStore } from "@/lib/shop-stores";
import { whatsappLink } from "@/lib/whatsapp";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusView } from "./OrderStatusView";

const t = getMessages();
const POLL_MS = 4000;
const POLL_LIMIT = 30;

/**
 * Thank you page. For online payments it waits for the payment provider to confirm
 * (the server decides, never this page) and updates on its own.
 */
export function Confirmation() {
  const params = useSearchParams();
  const number = params.get("number") ?? "";
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const last = lastOrderStore.useStore();
  const known = last?.number === number ? last : null;

  useEffect(() => {
    publicFetch<StoreSettings>("/settings").then(setSettings).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!known) return;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function load() {
      try {
        const result = await publicFetch<TrackedOrder>("/orders/track", { method: "POST", body: { number: known!.number, phone: known!.phone } });
        if (cancelled) return;
        setOrder(result);
        if (result.paymentStatus === "PAID" || result.paymentMethod === "COD") {
          clearCart();
          promoStore.set("");
        }
        if (result.paymentStatus === "PENDING" && attempts++ < POLL_LIMIT) timer = setTimeout(load, POLL_MS);
      } catch {
        if (!cancelled && attempts++ < POLL_LIMIT) timer = setTimeout(load, POLL_MS);
      }
    }
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [known]);

  const failed = order && (order.paymentStatus === "FAILED" || order.status === "CANCELLED") && order.paymentMethod !== "COD";
  const pending = order?.paymentStatus === "PENDING";

  if (failed) {
    return (
      <div className="flex max-w-2xl flex-col items-start gap-6">
        <h1 className="font-serif text-5xl leading-none">{t.errors.generic}</h1>
        <p className="text-[17px] text-ink-soft">{t.confirmation.paymentFailed}</p>
        <ButtonLink href="/checkout">{t.cart.checkout}</ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="flex flex-col items-start gap-6 lg:col-span-5">
        <p className="label text-terracotta">{t.confirmation.title}</p>
        <h1 className="font-serif text-display">{t.confirmation.heading}</h1>
        {number && (
          <div className="border border-ink px-5 py-4">
            <p className="label text-muted">{t.confirmation.number}</p>
            <p className="font-serif text-3xl tabular-nums">{number}</p>
          </div>
        )}
        <p className="max-w-md text-[17px] leading-relaxed text-ink-soft">{pending ? t.confirmation.paymentPending : t.confirmation.text}</p>
        {known?.hasEmail && !pending && <p className="text-[15px] text-ink-soft">{t.confirmation.emailSent}</p>}
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/track?number=${encodeURIComponent(number)}`} variant="secondary">
            {t.confirmation.track}
          </ButtonLink>
          <ButtonLink href="/shop">{t.confirmation.keepShopping}</ButtonLink>
        </div>
        {settings && number && whatsappNumbers(settings).length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {whatsappNumbers(settings).map((n, _i, all) => (
              <a
                key={n}
                href={whatsappLink(n, fmt(t.whatsapp.orderGreeting, { number }))}
                target="_blank"
                rel="noopener noreferrer"
                className="label link-underline py-1"
              >
                {all.length > 1 ? `${t.whatsapp.button}: ${formatLebanesePhone(n)}` : t.whatsapp.button}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        {known && !order && <Skeleton className="h-80 w-full" />}
        {order && <OrderStatusView order={order} />}
      </div>
    </div>
  );
}
