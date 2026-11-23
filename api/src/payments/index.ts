import type { PaymentMethod, PaymentMethodOption } from "@latelylebanon/shared";
import { badRequest } from "../lib/errors";
import { cashOnDelivery } from "./cod";
import type { PaymentProvider } from "./provider";

const providers: PaymentProvider[] = [cashOnDelivery];

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
