import type { PaymentMethod, PaymentMethodOption } from "@latelylebanon/shared";
import { badRequest } from "../lib/errors";
import { cardPayment } from "./card";
import { cashOnDelivery } from "./cod";
import type { PaymentProvider } from "./provider";
import { whishPayment } from "./whish";

/** Card and Whish are switched on with PAYMENT_CARD_ENABLED and PAYMENT_WHISH_ENABLED. */
const providers: PaymentProvider[] = [cashOnDelivery, cardPayment, whishPayment];

export function enabledPaymentMethods(): PaymentMethodOption[] {
  return providers
    .filter((p) => p.isEnabled())
    .map((p) => ({ method: p.method, label: p.label, description: p.description }));
}

export function getEnabledProvider(method: PaymentMethod): PaymentProvider {
  const provider = providers.find((p) => p.method === method && p.isEnabled());
  if (!provider) {
    throw badRequest("That payment method isn't available right now.", {
      paymentMethod: "Please choose another way to pay",
    });
  }
  return provider;
}

/** Looks up a provider even if it was switched off since the order was placed. */
export function getProvider(method: PaymentMethod): PaymentProvider | undefined {
  return providers.find((p) => p.method === method);
}
