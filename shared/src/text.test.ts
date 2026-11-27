import { describe, expect, it } from "vitest";
import { excerpt, formatWeight } from "./text";

describe("excerpt", () => {
  it("leaves short text alone", () => {
    expect(excerpt("Small batch apricot jam.")).toBe("Small batch apricot jam.");
  });

  it("cuts at the last full word and adds an ellipsis", () => {
    const text =
      "Baladi apricots from Bekaa orchards, picked ripe and cooked the same day with cane sugar and lemon. Bright, a little tart and very spoonable. Try it on labneh or warm man'oushe.";
    const out = excerpt(text);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/ o…$/);
    expect(text.startsWith(out.slice(0, -1))).toBe(true);
  });

  it("doesn't leave a trailing comma before the ellipsis", () => {
    expect(excerpt("one two three, four five six", 16)).toBe("one two three…");
  });
});

describe("formatWeight", () => {
  it("shows grams under a kilo and kilos above", () => {
    expect(formatWeight(250)).toBe("250 g");
    expect(formatWeight(1000)).toBe("1 kg");
    expect(formatWeight(1200)).toBe("1.2 kg");
    expect(formatWeight(1250)).toBe("1.25 kg");
    expect(formatWeight(12500)).toBe("12.5 kg");
  });
});
