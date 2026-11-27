import { describe, expect, it } from "vitest";
import { formatLebanesePhone, normalizeLebanesePhone, whatsappNumbers } from "./phone";
import { settingsSchema } from "./schemas";
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

describe("second WhatsApp number", () => {
  const base = {
    storeName: "Lately Lebanon",
    whatsappNumber: "03 550 789",
    contactEmail: "info@latelylebanon.com",
    announcementActive: false,
    heroHeading: "Hello",
    featuredBrandIds: [],
    featuredProductIds: [],
  };

  it("is optional and normalised when given", () => {
    expect(settingsSchema.parse(base).whatsappNumber2).toBeNull();
    expect(settingsSchema.parse({ ...base, whatsappNumber2: "" }).whatsappNumber2).toBeNull();
    expect(settingsSchema.parse({ ...base, whatsappNumber2: "+961 03 168 527" }).whatsappNumber2).toBe("+9613168527");
  });

  it("rejects a number that isn't Lebanese", () => {
    expect(settingsSchema.safeParse({ ...base, whatsappNumber2: "12345" }).success).toBe(false);
  });

  it("lists the main number first and skips an empty or repeated second one", () => {
    expect(whatsappNumbers({ whatsappNumber: "+9613550789", whatsappNumber2: "+9613168527" })).toEqual(["+9613550789", "+9613168527"]);
    expect(whatsappNumbers({ whatsappNumber: "+9613550789", whatsappNumber2: null })).toEqual(["+9613550789"]);
    expect(whatsappNumbers({ whatsappNumber: "+9613550789", whatsappNumber2: "+9613550789" })).toEqual(["+9613550789"]);
  });

  it("returns no numbers when WhatsApp is switched off", () => {
    expect(whatsappNumbers({ whatsappNumber: null, whatsappNumber2: null })).toEqual([]);
    expect(whatsappNumbers({ whatsappNumber: null, whatsappNumber2: "+9613168527" })).toEqual(["+9613168527"]);
  });

  it("lets the main number be left empty", () => {
    expect(settingsSchema.parse({ ...base, whatsappNumber: "" }).whatsappNumber).toBeNull();
  });
});
