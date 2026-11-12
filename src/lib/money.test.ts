import { describe, expect, it } from "vitest";
import { formatINR, parseRupeesToPaise } from "@/lib/money";

describe("money", () => {
  it("parses rupees into paise without floating point leftovers", () => {
    expect(parseRupeesToPaise("1000")).toBe(100000);
    expect(parseRupeesToPaise("1,000.50")).toBe(100050);
    expect(parseRupeesToPaise("0")).toBeNull();
    expect(parseRupeesToPaise("10.999")).toBeNull();
  });

  it("formats paise as Indian rupees", () => {
    expect(formatINR(1100000)).toContain("11,000");
  });
});
