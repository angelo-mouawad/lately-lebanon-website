import { describe, expect, it } from "vitest";
import { evaluatePromo, type PromoLike } from "../services/pricing";

const base: PromoLike = {
  code: "SOUK",
  type: "PERCENT",
  value: 15,
  minOrderCents: 0,
  expiresAt: null,
  usageLimit: null,
  timesUsed: 0,
  isActive: true,
};

const now = new Date("2026-06-15T12:00:00Z");

describe("promo codes", () => {
  it("applies a percentage, rounded to the cent", () => {
    expect(evaluatePromo(base, 3333, now)).toEqual({ ok: true, discountCents: 500 });
  });

  it("applies a fixed amount", () => {
    expect(evaluatePromo({ ...base, type: "FIXED", value: 1000 }, 4500, now)).toEqual({ ok: true, discountCents: 1000 });
  });

  it("never discounts more than the subtotal", () => {
    expect(evaluatePromo({ ...base, type: "FIXED", value: 5000 }, 3000, now)).toEqual({ ok: true, discountCents: 3000 });
    expect(evaluatePromo({ ...base, value: 100 }, 3000, now)).toEqual({ ok: true, discountCents: 3000 });
  });

  it("rejects unknown codes", () => {
    expect(evaluatePromo(null, 3000, now).ok).toBe(false);
  });

  it("rejects inactive codes", () => {
    expect(evaluatePromo({ ...base, isActive: false }, 3000, now)).toEqual({
      ok: false,
      message: "This code is no longer active.",
    });
  });

  it("rejects expired codes and accepts them before expiry", () => {
    expect(evaluatePromo({ ...base, expiresAt: new Date("2026-06-15T11:59:59Z") }, 3000, now)).toEqual({
      ok: false,
      message: "This code has expired.",
    });
    expect(evaluatePromo({ ...base, expiresAt: new Date("2026-06-15T23:59:59Z") }, 3000, now).ok).toBe(true);
  });

  it("rejects codes that reached their usage limit", () => {
    expect(evaluatePromo({ ...base, usageLimit: 50, timesUsed: 50 }, 3000, now)).toEqual({
      ok: false,
      message: "This code has already been used up.",
    });
    expect(evaluatePromo({ ...base, usageLimit: 50, timesUsed: 49 }, 3000, now).ok).toBe(true);
  });

  it("enforces the minimum order", () => {
    expect(evaluatePromo({ ...base, minOrderCents: 3000 }, 2999, now)).toEqual({
      ok: false,
      message: "Spend $30 or more to use this code.",
    });
    expect(evaluatePromo({ ...base, minOrderCents: 3000 }, 3000, now).ok).toBe(true);
  });
});
