import type { Metadata } from "next";
import type { DeliveryZoneOption, PaymentMethodOption } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { apiGet } from "@/lib/api";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { Container } from "@/components/store/sections";

const t = getMessages();

export const metadata: Metadata = { title: t.checkout.title, robots: { index: false } };

export default async function CheckoutPage() {
  const [zones, methods] = await Promise.all([
    apiGet<DeliveryZoneOption[]>("/delivery-zones", { tags: ["settings"] }),
    apiGet<PaymentMethodOption[]>("/payment-methods", { tags: ["settings"] }),
  ]);

  return (
    <Container className="pt-10 lg:pt-14">
      <h1 className="mb-10 font-serif text-5xl leading-none">{t.checkout.title}</h1>
      <CheckoutForm zones={zones} methods={methods} />
    </Container>
  );
}
