import type { PaymentProvider } from "./provider";

export const cashOnDelivery: PaymentProvider = {
  method: "COD",
  label: "Cash on delivery",
  description: "Pay in cash when your order arrives.",
  isEnabled: () => true,
  async start() {
    return { redirectUrl: null, providerRef: null };
  },
};
