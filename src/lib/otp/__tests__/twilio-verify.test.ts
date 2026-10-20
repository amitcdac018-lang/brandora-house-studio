import { describe, it, expect, vi, beforeEach } from "vitest";
import { toE164 } from "../twilio-verify";

const verificationsCreate = vi.fn();

vi.mock("twilio", () => ({
  default: () => ({
    verify: {
      v2: {
        services: () => ({
          verifications: { create: verificationsCreate },
        }),
      },
    },
  }),
}));

vi.stubEnv("TWILIO_ACCOUNT_SID", "ACtest");
vi.stubEnv("TWILIO_AUTH_TOKEN", "test-token");
vi.stubEnv("TWILIO_VERIFY_SERVICE_SID", "VAtest");

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

describe("sendOtp", () => {
  beforeEach(() => {
    verificationsCreate.mockReset();
  });

  it("throws OtpSendConfigError with a non-retry message for an unverified trial number (21608)", async () => {
    const { sendOtp, OtpSendConfigError } = await import("../twilio-verify");
    verificationsCreate.mockRejectedValue(Object.assign(new Error("unverified"), { code: 21608 }));

    await expect(sendOtp("+919876543210")).rejects.toBeInstanceOf(OtpSendConfigError);
  });

  it("throws OtpSendConfigError for an invalid/unreachable number (21211)", async () => {
    const { sendOtp, OtpSendConfigError } = await import("../twilio-verify");
    verificationsCreate.mockRejectedValue(Object.assign(new Error("invalid"), { code: 21211 }));

    await expect(sendOtp("+919876543210")).rejects.toBeInstanceOf(OtpSendConfigError);
  });

  it("re-throws unrecognized Twilio errors as-is (treated as transient/retryable upstream)", async () => {
    const { sendOtp, OtpSendConfigError } = await import("../twilio-verify");
    const genericError = Object.assign(new Error("rate limited"), { code: 20429 });
    verificationsCreate.mockRejectedValue(genericError);

    await expect(sendOtp("+919876543210")).rejects.toBe(genericError);
    await expect(sendOtp("+919876543210")).rejects.not.toBeInstanceOf(OtpSendConfigError);
  });
});
