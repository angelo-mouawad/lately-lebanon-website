import type { PaymentMethod } from "@latelylebanon/shared";

export interface PaymentOrder {
  id: number;
  number: string;
  totalCents: number;
  customerName: string;
  phone: string;
  email: string | null;
}

export interface StartPaymentResult {
  /** Where to send the customer to pay, or null when nothing is paid online. */
  redirectUrl: string | null;
  providerRef: string | null;
  raw?: unknown;
}

export interface PaymentProvider {
  readonly method: PaymentMethod;
  readonly label: string;
  readonly description: string;
  isEnabled(): boolean;
  /** Starts a payment. Card data is never sent to or stored on our server. */
  start(order: PaymentOrder): Promise<StartPaymentResult>;
}
