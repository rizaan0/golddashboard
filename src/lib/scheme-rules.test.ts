import { describe, expect, it } from "vitest";
import { shouldCompleteScheme, shouldReopenScheme } from "@/lib/scheme-rules";

describe("scheme completion", () => {
  it("completes at 11 posted payments and reopens below that", () => {
    expect(shouldCompleteScheme(10)).toBe(false);
    expect(shouldCompleteScheme(11)).toBe(true);
    expect(shouldReopenScheme(11)).toBe(false);
    expect(shouldReopenScheme(10)).toBe(true);
  });
});
