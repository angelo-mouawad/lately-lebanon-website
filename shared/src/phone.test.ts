import { describe, expect, it } from "vitest";
import { formatLebanesePhone, normalizeLebanesePhone } from "./phone";
import { formatUSD, percentOf } from "./money";

describe("normalizeLebanesePhone", () => {
  it.each([
    ["03 123 456", "+9613123456"],
    ["03-123456", "+9613123456"],
    ["70 123 456", "+96170123456"],
    ["071123456", "+96171123456"],
    ["81 123 456", "+96181123456"],
    ["01 234 567", "+9611234567"],
    ["+961 3 123 456", "+9613123456"],
    ["+961 76 123 456", "+96176123456"],
    ["00961 78 123 456", "+96178123456"],
    ["961 79 123456", "+96179123456"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeLebanesePhone(input)).toBe(expected);
  });

  it.each(["", "12345", "72 123 456", "+33 6 12 34 56 78", "03 123 45", "70 123 4567", "abc"])(
    "rejects %s",
    (input) => {
      expect(normalizeLebanesePhone(input)).toBeNull();
    },
  );

  it("formats for display", () => {
    expect(formatLebanesePhone("+96170123456")).toBe("70 123 456");
    expect(formatLebanesePhone("+9613123456")).toBe("03 123 456");
  });
});

describe("money", () => {
  it("formats whole and fractional dollars", () => {
    expect(formatUSD(4500)).toBe("$45");
    expect(formatUSD(4550)).toBe("$45.50");
  });

  it("rounds percentages to the nearest cent", () => {
    expect(percentOf(1000, 20)).toBe(200);
    expect(percentOf(1999, 17.5)).toBe(350);
    expect(percentOf(333, 15)).toBe(50);
  });
});
