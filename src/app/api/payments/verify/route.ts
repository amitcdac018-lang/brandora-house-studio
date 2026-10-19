import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { verifyPaymentSchema } from "@/lib/validations/checkout";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { success } = await rateLimit(`verify-payment:${user.id}:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment verification payload." }, { status: 400 });
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId: order.id, providerOrderId: razorpay_order_id },
  });
  if (!payment) {
    return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
  }

  // Signature already verified elsewhere (duplicate submit) — report success idempotently.
  if (payment.status === "CAPTURED") {
    return NextResponse.json({ ok: true });
  }

  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", providerPaymentId: razorpay_payment_id },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PAYMENT_SIGNATURE_INVALID",
          entityType: "Payment",
          entityId: payment.id,
          orderId: order.id,
        },
      }),
    ]);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "CAPTURED",
        providerPaymentId: razorpay_payment_id,
        providerSignature: razorpay_signature,
      },
    }),
    prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_CAPTURED",
        entityType: "Payment",
        entityId: payment.id,
        orderId: order.id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
