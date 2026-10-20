import { describe, it, expect } from "vitest";
import { toE164 } from "../twilio-verify";

describe("toE164", () => {
  it("converts a bare 10-digit Indian mobile number to E.164", () => {
    expect(toE164("9876543210")).toBe("+919876543210");
  });

  it("accepts a number already prefixed with the country code", () => {
    expect(toE164("919876543210")).toBe("+919876543210");
  });

  it("strips spaces and dashes before converting", () => {
    expect(toE164("98765 43210")).toBe("+919876543210");
    expect(toE164("98765-43210")).toBe("+919876543210");
  });

  it("rejects a number not starting with 6-9", () => {
    expect(toE164("1234567890")).toBeNull();
  });

  it("rejects a number that is too short", () => {
    expect(toE164("12345")).toBeNull();
  });

  it("rejects an 11-digit number with no recognizable country-code pattern", () => {
    expect(toE164("97453432335")).toBeNull();
  });
});
