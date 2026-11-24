import { env } from "../lib/env";
import { providerFetch, type PaymentProvider, type VerifyResult } from "./provider";

/**
 * Whish Money collect payments. The customer is sent to Whish to approve the payment,
 * then we ask Whish's status endpoint whether it went through.
 *
 * This follows Whish's merchant collect API (create payment, then check status by
 * external id). Confirm the endpoint paths and field names with Whish when you get your
 * merchant channel and secret, and test on their sandbox before going live.
 */

function headers() {
  return {
    "Content-Type": "application/json",
    channel: env.WHISH_CHANNEL ?? "",
    secret: env.WHISH_SECRET ?? "",
    websiteurl: env.WHISH_WEBSITE_URL ?? new URL(env.WEB_ORIGIN).host,
  };
}

const api = (path: string) => `${env.WHISH_API_URL.replace(/\/$/, "")}${path}`;

/** Whish identifies payments by a numeric external id. We use the digits of the order number. */
export const whishExternalId = (orderNumber: string) => Number(orderNumber.replace(/\D/g, ""));

/** Reads a Whish status response. Only "success" counts as paid. */
export function interpretWhishStatus(raw: unknown): VerifyResult {
  const body = (raw ?? {}) as { status?: boolean; data?: { collectStatus?: string; payerPhoneNumber?: string } };
  const collect = String(body.data?.collectStatus ?? "").toLowerCase();
  if (body.status && collect === "success") return { status: "PAID", raw };
  if (collect === "failed" || collect === "expired" || collect === "cancelled") return { status: "FAILED", raw };
  return { status: "PENDING", raw };
}

export const whishPayment: PaymentProvider = {
  method: "WHISH",
  label: "Whish",
  description: "Pay from your Whish account.",

  isEnabled: () => env.PAYMENT_WHISH_ENABLED && Boolean(env.WHISH_CHANNEL && env.WHISH_SECRET),

  async start(order) {
    const callback = `${env.API_ORIGIN}/payments/whish/callback?order=${encodeURIComponent(order.number)}`;
    const back = `${env.API_ORIGIN}/payments/whish/return?order=${encodeURIComponent(order.number)}`;
    const { status, body } = await providerFetch(api("/payment/whish"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        amount: Number((order.totalCents / 100).toFixed(2)),
        currency: "USD",
        invoice: `Lately Lebanon order ${order.number}`,
        externalId: whishExternalId(order.number),
        successCallbackUrl: callback,
        failureCallbackUrl: callback,
        successRedirectUrl: back,
        failureRedirectUrl: back,
      }),
    });
    const data = body as { status?: boolean; data?: { collectUrl?: string } } | null;
    if (status >= 300 || !data?.status || !data.data?.collectUrl) throw new Error(`Whish payment failed with status ${status}`);
    return { redirectUrl: data.data.collectUrl, providerRef: String(whishExternalId(order.number)), raw: body };
  },

  async verify({ orderNumber }) {
    const { status, body } = await providerFetch(api("/payment/collect/status"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ currency: "USD", externalId: whishExternalId(orderNumber) }),
    });
    if (status >= 300) throw new Error(`Whish status check failed with status ${status}`);
    return interpretWhishStatus(body);
  },
};
