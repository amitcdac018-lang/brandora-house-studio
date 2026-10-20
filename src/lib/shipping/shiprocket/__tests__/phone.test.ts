import { describe, it, expect } from "vitest";
import { toShiprocketPhone } from "../client";

describe("toShiprocketPhone", () => {
  it("accepts a bare 10-digit Indian mobile number unchanged", () => {
    expect(toShiprocketPhone("9876543210")).toBe("9876543210");
  });

  it("strips a +91 country code", () => {
    expect(toShiprocketPhone("+919876543210")).toBe("9876543210");
  });

  it("strips a 91 country code without the plus", () => {
    expect(toShiprocketPhone("919876543210")).toBe("9876543210");
  });

  it("strips a leading 0 (STD-style domestic format)", () => {
    expect(toShiprocketPhone("09876543210")).toBe("9876543210");
  });

  it("strips spaces, dashes, and parentheses", () => {
    expect(toShiprocketPhone("+91 98765-43210")).toBe("9876543210");
  });

  it("rejects an 11-digit number that isn't a recognizable country-code/STD pattern", () => {
    // This is the exact real-world case that broke Shiprocket booking: an 11-digit
    // number that doesn't start with 91 or 0, so there's no safe way to trim it to 10.
    expect(toShiprocketPhone("97453432335")).toBeNull();
  });

  it("rejects a number that is too short", () => {
    expect(toShiprocketPhone("12345")).toBeNull();
  });

  it("rejects a number not starting with 6-9 after normalization", () => {
    expect(toShiprocketPhone("1234567890")).toBeNull();
  });
});
