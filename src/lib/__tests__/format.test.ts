import { describe, it, expect } from "vitest";
import { formatPrice, discountedPrice } from "../format";

describe("format helpers", () => {
  it("formats a number as INR currency", () => {
    expect(formatPrice(1999)).toContain("1,999");
  });

  it("applies a discount percentage correctly", () => {
    expect(discountedPrice(1000, 10)).toBe(900);
  });

  it("returns the original price when discount is zero", () => {
    expect(discountedPrice(1500, 0)).toBe(1500);
  });

  it("rounds the discounted price to the nearest integer", () => {
    expect(discountedPrice(999, 33)).toBe(Math.round(999 * 0.67));
  });

  it("handles a string base price", () => {
    expect(discountedPrice("2000", 25)).toBe(1500);
  });
});
