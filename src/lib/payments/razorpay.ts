import "server-only";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

let client: Razorpay | null = null;

/** Lazily constructed so builds/tests that never touch payments don't require real keys. */
export function getRazorpayClient(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: getEnv("RAZORPAY_KEY_ID"),
      key_secret: getEnv("RAZORPAY_KEY_SECRET"),
    });
  }
  return client;
}

/** Verifies the Checkout handler's signature (order_id|payment_id signed with key_secret). */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = getEnv("RAZORPAY_KEY_SECRET");
  const expected = createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  return safeCompare(expected, params.signature);
}

/** Verifies an incoming webhook payload against the configured webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = getEnv("RAZORPAY_WEBHOOK_SECRET");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompare(expected, signature);
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
