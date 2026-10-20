import { describe, it, expect, beforeEach, vi } from "vitest";

describe("verification tickets", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-for-ticket-tests-only";
    vi.resetModules();
  });

  it("issues a ticket that verifies successfully for the same phone", async () => {
    const { issueVerificationTicket, verifyTicket } = await import("../verification-ticket");
    const ticket = issueVerificationTicket("+919876543210");
    expect(verifyTicket("+919876543210", ticket)).toBe(true);
  });

  it("rejects a ticket checked against a different phone number", async () => {
    const { issueVerificationTicket, verifyTicket } = await import("../verification-ticket");
    const ticket = issueVerificationTicket("+919876543210");
    expect(verifyTicket("+911111111111", ticket)).toBe(false);
  });

  it("rejects a tampered ticket", async () => {
    const { issueVerificationTicket, verifyTicket } = await import("../verification-ticket");
    const ticket = issueVerificationTicket("+919876543210");
    const tampered = ticket.slice(0, -2) + "xx";
    expect(verifyTicket("+919876543210", tampered)).toBe(false);
  });

  it("rejects garbage input that isn't a valid ticket", async () => {
    const { verifyTicket } = await import("../verification-ticket");
    expect(verifyTicket("+919876543210", "not-a-real-ticket")).toBe(false);
  });

  it("rejects an expired ticket", async () => {
    vi.useFakeTimers();
    const { issueVerificationTicket, verifyTicket } = await import("../verification-ticket");
    const ticket = issueVerificationTicket("+919876543210");

    vi.advanceTimersByTime(6 * 60 * 1000); // past the 5-minute TTL

    expect(verifyTicket("+919876543210", ticket)).toBe(false);
    vi.useRealTimers();
  });

  it("rejects a ticket signed with a different secret (e.g. after AUTH_SECRET rotation)", async () => {
    const { issueVerificationTicket } = await import("../verification-ticket");
    const ticket = issueVerificationTicket("+919876543210");

    process.env.AUTH_SECRET = "a-different-secret-entirely";
    vi.resetModules();
    const { verifyTicket } = await import("../verification-ticket");

    expect(verifyTicket("+919876543210", ticket)).toBe(false);
  });
});
