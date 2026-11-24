import { env } from "../lib/env";
import { providerFetch, type PaymentProvider, type VerifyResult } from "./provider";

/**
 * Visa and Mastercard through a Lebanese bank gateway on Mastercard Payment Gateway
 * Services (MPGS), as used by Areeba. The customer pays on the gateway's hosted page,
 * so card details never touch our server.
 *
 * This is a ready to configure implementation of the standard MPGS Hosted Checkout flow.
 * Before going live, confirm the gateway URL, API version and redirect format with the bank,
 * and run a test payment on their test merchant.
 */

const base = () => `${env.MPGS_GATEWAY_URL.replace(/\/$/, "")}/api/rest/version/${env.MPGS_API_VERSION}/merchant/${env.MPGS_MERCHANT_ID}`;

function authHeader() {
  const token = Buffer.from(`merchant.${env.MPGS_MERCHANT_ID}:${env.MPGS_API_PASSWORD}`).toString("base64");
  return { Authorization: `Basic ${token}`, "Content-Type": "application/json" };
}

const toAmount = (cents: number) => (cents / 100).toFixed(2);

/** Removes card details (masked or not) before a gateway response is stored. */
function withoutCardData(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const { sourceOfFunds: _sourceOfFunds, transaction, ...rest } = raw as Record<string, unknown>;
  return {
    ...rest,
    transaction: Array.isArray(transaction)
      ? transaction.map((t) => {
          if (!t || typeof t !== "object") return t;
          const { sourceOfFunds: _s, ...keep } = t as Record<string, unknown>;
          return keep;
        })
      : undefined,
  };
}

/**
 * Reads an MPGS "retrieve order" response. An order counts as paid only when the gateway
 * says it was captured in full, in USD, for the amount we expect.
 */
export function interpretMpgsOrder(raw: unknown, expectedCents: number): VerifyResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const status = String(o.status ?? "").toUpperCase();
  const amount = Math.round(Number(o.totalCapturedAmount ?? o.amount ?? 0) * 100);
  const currency = String(o.currency ?? "").toUpperCase();
  const reference = typeof o.id === "string" ? o.id : null;
  const clean = withoutCardData(raw);

  if (["CAPTURED", "PURCHASED"].includes(status) && currency === "USD" && amount === expectedCents) {
    return { status: "PAID", reference, raw: clean };
  }
  if (["FAILED", "CANCELLED", "DECLINED", "EXPIRED"].includes(status) || o.result === "FAILURE") {
    return { status: "FAILED", reference, raw: clean };
  }
  return { status: "PENDING", reference, raw: clean };
}

export const cardPayment: PaymentProvider = {
  method: "CARD",
  label: "Visa or Mastercard",
  description: "Pay securely on the bank's payment page.",

  isEnabled: () => env.PAYMENT_CARD_ENABLED && Boolean(env.MPGS_MERCHANT_ID && env.MPGS_API_PASSWORD),

  async start(order) {
    const { status, body } = await providerFetch(`${base()}/session`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        apiOperation: "INITIATE_CHECKOUT",
        interaction: {
          operation: "PURCHASE",
          returnUrl: `${env.API_ORIGIN}/payments/card/return?order=${encodeURIComponent(order.number)}`,
          merchant: { name: "Lately Lebanon" },
          displayControl: { billingAddress: "HIDE", shipping: "HIDE" },
        },
        order: {
          id: order.number,
          reference: order.number,
          amount: toAmount(order.totalCents),
          currency: "USD",
          description: `Lately Lebanon order ${order.number}`,
        },
      }),
    });
    const session = (body as { session?: { id?: string }; successIndicator?: string } | null)?.session;
    if (status >= 300 || !session?.id) throw new Error(`MPGS session failed with status ${status}`);
    return {
      redirectUrl: `${env.MPGS_GATEWAY_URL.replace(/\/$/, "")}/checkout/pay/${session.id}?checkoutVersion=1.0.0`,
      providerRef: session.id,
      raw: { sessionId: session.id, successIndicator: (body as { successIndicator?: string }).successIndicator },
    };
  },

  async verify({ orderNumber, amountCents }) {
    const { status, body } = await providerFetch(`${base()}/order/${encodeURIComponent(orderNumber)}`, {
      method: "GET",
      headers: authHeader(),
    });
    if (status === 404 || status === 400) return { status: "PENDING", raw: body };
    if (status >= 300) throw new Error(`MPGS order lookup failed with status ${status}`);
    return interpretMpgsOrder(body, amountCents);
  },
};
