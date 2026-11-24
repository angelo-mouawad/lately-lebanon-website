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

export interface VerifyInput {
  orderNumber: string;
  providerRef: string | null;
  amountCents: number;
}

export interface VerifyResult {
  status: "PAID" | "PENDING" | "FAILED";
  /** The provider's own transaction or order reference, when it gives one. */
  reference?: string | null;
  raw: unknown;
}

export interface PaymentProvider {
  readonly method: PaymentMethod;
  readonly label: string;
  readonly description: string;
  isEnabled(): boolean;
  /** Starts a payment. Card data is never sent to or stored on our server. */
  start(order: PaymentOrder): Promise<StartPaymentResult>;
  /**
   * Asks the provider, server to server, whether the order was paid. This is the only
   * thing that can mark an order as paid: browser redirects and webhook bodies are never trusted.
   */
  verify?(input: VerifyInput): Promise<VerifyResult>;
}

/** fetch with a timeout, for calls to payment providers. */
export async function providerFetch(url: string, init: RequestInit, timeoutMs = 15000): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep the text body as is.
  }
  return { status: res.status, body };
}
