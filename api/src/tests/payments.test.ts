import { describe, expect, it } from "vitest";
import { interpretMpgsOrder } from "../payments/card";
import { interpretWhishStatus, whishExternalId } from "../payments/whish";

describe("card payment confirmation (MPGS)", () => {
  it("counts a captured order for the right amount in USD as paid", () => {
    const result = interpretMpgsOrder({ id: "LL-10482", status: "CAPTURED", totalCapturedAmount: 54.4, currency: "USD" }, 5440);
    expect(result.status).toBe("PAID");
    expect(result.reference).toBe("LL-10482");
  });

  it("refuses a captured order with a different amount", () => {
    expect(interpretMpgsOrder({ status: "CAPTURED", totalCapturedAmount: 1, currency: "USD" }, 5440).status).toBe("PENDING");
  });

  it("refuses a captured order in another currency", () => {
    expect(interpretMpgsOrder({ status: "CAPTURED", totalCapturedAmount: 54.4, currency: "LBP" }, 5440).status).toBe("PENDING");
  });

  it("reports failed and declined payments", () => {
    expect(interpretMpgsOrder({ status: "FAILED" }, 5440).status).toBe("FAILED");
    expect(interpretMpgsOrder({ status: "AUTHENTICATION_INITIATED", result: "FAILURE" }, 5440).status).toBe("FAILED");
  });

  it("never stores card details from the gateway response", () => {
    const result = interpretMpgsOrder(
      {
        status: "CAPTURED",
        totalCapturedAmount: 10,
        currency: "USD",
        sourceOfFunds: { provided: { card: { number: "512345xxxxxx0008" } } },
        transaction: [{ id: "1", sourceOfFunds: { provided: { card: { number: "512345xxxxxx0008" } } } }],
      },
      1000,
    );
    expect(JSON.stringify(result.raw)).not.toContain("512345");
  });
});

describe("Whish payment confirmation", () => {
  it("counts only a successful collect as paid", () => {
    expect(interpretWhishStatus({ status: true, data: { collectStatus: "success" } }).status).toBe("PAID");
    expect(interpretWhishStatus({ status: true, data: { collectStatus: "pending" } }).status).toBe("PENDING");
    expect(interpretWhishStatus({ status: true, data: { collectStatus: "failed" } }).status).toBe("FAILED");
    expect(interpretWhishStatus({ status: false }).status).toBe("PENDING");
  });

  it("uses the order number digits as the external id", () => {
    expect(whishExternalId("LL-10482")).toBe(10482);
  });
});
