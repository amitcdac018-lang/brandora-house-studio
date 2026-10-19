import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifyPaymentSignature, verifyWebhookSignature } from "../razorpay";

describe("razorpay signature verification", () => {
  it("accepts a correctly signed payment verification payload", () => {
    const orderId = "order_test123";
    const paymentId = "pay_test456";
    const expectedSignature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(verifyPaymentSignature({ orderId, paymentId, signature: expectedSignature })).toBe(true);
  });

  it("rejects a tampered payment signature", () => {
    const result = verifyPaymentSignature({
      orderId: "order_test123",
      paymentId: "pay_test456",
      signature: "0".repeat(64),
    });
    expect(result).toBe(false);
  });

  it("rejects a signature for a different order/payment pair", () => {
    const signatureForOther = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update("order_other|pay_other")
      .digest("hex");

    const result = verifyPaymentSignature({
      orderId: "order_test123",
      paymentId: "pay_test456",
      signature: signatureForOther,
    });
    expect(result).toBe(false);
  });

  it("accepts a correctly signed webhook body", () => {
    const rawBody = JSON.stringify({ event: "payment.captured" });
    const signature = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!).update(rawBody).digest("hex");

    expect(verifyWebhookSignature(rawBody, signature)).toBe(true);
  });

  it("rejects a webhook body with an invalid signature", () => {
    const rawBody = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(rawBody, "invalid-signature")).toBe(false);
  });

  it("rejects a webhook body that was modified after signing", () => {
    const originalBody = JSON.stringify({ event: "payment.captured", amount: 100 });
    const signature = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!).update(originalBody).digest("hex");

    const tamperedBody = JSON.stringify({ event: "payment.captured", amount: 999999 });
    expect(verifyWebhookSignature(tamperedBody, signature)).toBe(false);
  });
});
