import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const TICKET_TTL_MS = 5 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing required environment variable: AUTH_SECRET");
  return secret;
}

/**
 * A short-lived, signed proof that a phone number's OTP was just verified via Twilio.
 * The Auth.js credentials provider for OTP login trusts this ticket instead of re-checking
 * the raw code, so the actual OTP check (with Twilio's own attempt/expiry limits) only ever
 * happens once, in the dedicated /api/auth/otp/verify route — not inside the auth provider,
 * which has no rate limiting of its own and would otherwise be a second attack surface for
 * guessing codes.
 */
export function issueVerificationTicket(phone: string): string {
  const expiresAt = Date.now() + TICKET_TTL_MS;
  const payload = `${phone}:${expiresAt}`;
  const signature = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyTicket(phone: string, ticket: string): boolean {
  let decoded: string;
  try {
    decoded = Buffer.from(ticket, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const parts = decoded.split(":");
  if (parts.length !== 3) return false;
  const [ticketPhone, expiresAtRaw, signature] = parts;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  if (ticketPhone !== phone) return false;

  const expectedPayload = `${ticketPhone}:${expiresAtRaw}`;
  const expectedSignature = createHmac("sha256", getSecret()).update(expectedPayload).digest("hex");

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(sigBuf, expectedBuf);
}
