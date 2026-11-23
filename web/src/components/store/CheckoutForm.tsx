"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  checkoutSchema,
  formatUSD,
  type CheckoutResult,
  type DeliveryZoneOption,
  type PaymentMethod,
  type PaymentMethodOption,
} from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { ApiError, errorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { publicFetch } from "@/lib/public-api";
import { clearCart, lastOrderStore, promoStore, usePromo } from "@/lib/shop-stores";
import { zodFields } from "@/lib/zod-fields";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { CartLines } from "./CartLines";
import { PromoField, Totals } from "./OrderSummary";
import { useQuote } from "./use-quote";

const t = getMessages();

interface Customer {
  name: string;
  phone: string;
  email: string;
  zoneId: number | null;
  city: string;
  address: string;
  notes: string;
}

export function CheckoutForm({ zones, methods }: { zones: DeliveryZoneOption[]; methods: PaymentMethodOption[] }) {
  const router = useRouter();
  const promoCode = usePromo();
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "", zoneId: null, city: "", address: "", notes: "" });
  const [method, setMethod] = useState<PaymentMethod>(methods[0]?.method ?? "COD");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { lines, quote } = useQuote({ zoneId: customer.zoneId, promoCode: promoCode || null, enabled: !redirecting });

  const set = <K extends keyof Customer>(key: K, value: Customer[K]) => {
    setCustomer((c) => ({ ...c, [key]: value }));
    setErrors((e) => {
      const { [`customer.${key}`]: _, ...rest } = e;
      return rest;
    });
  };

  if (lines.length === 0 && !busy && !redirecting) {
    return (
      <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong p-10">
        <p className="font-serif text-2xl">{t.checkout.emptyBag}</p>
        <ButtonLink href="/shop" variant="secondary">
          {t.cart.continue}
        </ButtonLink>
      </div>
    );
  }

  const unavailable = quote?.lines.some((l) => !l.available) ?? false;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      customer: { ...customer, zoneId: customer.zoneId ?? 0 },
      paymentMethod: method,
      promoCode: promoCode || null,
    };
    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      const fields = zodFields(parsed.error);
      setErrors(fields);
      setFormError(null);
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      const result = await publicFetch<CheckoutResult>("/checkout", { method: "POST", body: payload });
      lastOrderStore.set({ number: result.orderNumber, phone: parsed.data.customer.phone, hasEmail: Boolean(parsed.data.customer.email) });
      if (result.redirectUrl) {
        setRedirecting(true);
        window.location.assign(result.redirectUrl);
        return;
      }
      clearCart();
      promoStore.set("");
      router.push(`/order-confirmed?number=${encodeURIComponent(result.orderNumber)}`);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields);
      setFormError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-12">
      <div className="flex flex-col gap-10 lg:col-span-7">
        {formError && (
          <div role="alert" className="border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
            {formError}
          </div>
        )}

        <fieldset className="flex flex-col gap-5">
          <legend className="label mb-5 w-full border-t border-ink pt-4">{t.checkout.contact}</legend>
          <Field label={t.checkout.name} error={errors["customer.name"]}>
            <Input autoComplete="name" value={customer.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t.checkout.phone} hint={t.checkout.phoneHint} error={errors["customer.phone"]}>
              <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="70 123 456" value={customer.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label={t.checkout.email} optional optionalLabel={t.common.optional} hint={t.checkout.emailHint} error={errors["customer.email"]}>
              <Input type="email" inputMode="email" autoComplete="email" value={customer.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="label mb-5 w-full border-t border-ink pt-4">{t.checkout.delivery}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t.checkout.zone} error={errors["customer.zoneId"] ?? errors.zoneId}>
              <Select value={customer.zoneId ?? ""} onChange={(e) => set("zoneId", e.target.value ? Number(e.target.value) : null)}>
                <option value="">{t.checkout.zonePlaceholder}</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({formatUSD(z.feeCents)})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.checkout.city} error={errors["customer.city"]}>
              <Input autoComplete="address-level2" value={customer.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </div>
          <Field label={t.checkout.address} hint={t.checkout.addressHint} error={errors["customer.address"]}>
            <Textarea rows={3} autoComplete="street-address" value={customer.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label={t.checkout.notes} optional optionalLabel={t.common.optional} error={errors["customer.notes"]}>
            <Textarea rows={2} value={customer.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="label mb-5 w-full border-t border-ink pt-4">{t.checkout.payment}</legend>
          <div className="flex flex-col gap-px border border-line bg-line">
            {methods.map((m) => (
              <label
                key={m.method}
                className={cn("flex cursor-pointer items-start gap-3 bg-paper p-4", method === m.method && "outline-2 outline-ink -outline-offset-2")}
              >
                <input
                  type="radio"
                  name="payment"
                  value={m.method}
                  checked={method === m.method}
                  onChange={() => setMethod(m.method)}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer border border-line-strong bg-paper checked:border-[6px] checked:border-ink"
                />
                <span className="flex flex-col">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-sm text-muted">{m.description}</span>
                </span>
              </label>
            ))}
          </div>
          {methods.some((m) => m.method === "CARD") && <p className="mt-3 text-sm text-muted">{t.checkout.secureNote}</p>}
          {errors.paymentMethod && <p className="mt-2 text-sm text-danger">{errors.paymentMethod}</p>}
        </fieldset>
      </div>

      <aside className="lg:col-span-4 lg:col-start-9">
        <div className="flex flex-col gap-6 border border-line bg-paper p-6 lg:sticky lg:top-28">
          <h2 className="label">{t.checkout.summary}</h2>
          <CartLines lines={lines} quote={quote} compact editable={false} />
          <PromoField quote={quote} error={errors.promoCode} />
          <Totals quote={quote} zoneChosen={customer.zoneId != null} />
          <Button type="submit" size="lg" block loading={busy || redirecting} disabled={unavailable}>
            {redirecting ? t.checkout.redirecting : busy ? t.checkout.placing : t.checkout.placeOrder}
          </Button>
          <p className="text-xs text-muted">
            {t.checkout.agree.split("{terms}")[0]}
            <Link href="/terms" className="underline underline-offset-2">
              {t.checkout.terms}
            </Link>
            {t.checkout.agree.split("{terms}")[1]}
          </p>
        </div>
      </aside>
    </form>
  );
}
