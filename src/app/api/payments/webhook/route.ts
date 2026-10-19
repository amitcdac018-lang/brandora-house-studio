import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

/**
 * Razorpay webhook — the authoritative, server-to-server source of truth for payment state.
 * Client-side verification (api/payments/verify) is a UX fast-path only; this handler must
 * independently verify the signature and is safe to process even if the client never calls back.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let isValid: boolean;
  try {
    isValid = verifyWebhookSignature(rawBody, signature);
  } catch {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; status: string } };
      refund?: { entity: { id: string; payment_id: string; amount: number; status: string } };
    };
  };

  switch (event.event) {
    case "payment.captured": {
      const paymentEntity = event.payload.payment?.entity;
      if (!paymentEntity) break;

      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: paymentEntity.order_id },
      });
      if (!payment) break;

      if (payment.status !== "CAPTURED") {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "CAPTURED",
              providerPaymentId: paymentEntity.id,
              rawWebhookPayload: event as unknown as object,
            },
          }),
          prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } }),
          prisma.auditLog.create({
            data: {
              action: "PAYMENT_CAPTURED_WEBHOOK",
              entityType: "Payment",
              entityId: payment.id,
              orderId: payment.orderId,
            },
          }),
        ]);
      }
      break;
    }

    case "payment.failed": {
      const paymentEntity = event.payload.payment?.entity;
      if (!paymentEntity) break;

      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: paymentEntity.order_id },
      });
      if (!payment) break;

      await restoreStockForOrder(payment.orderId);

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED", rawWebhookPayload: event as unknown as object },
        }),
        prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAYMENT_FAILED" } }),
        prisma.auditLog.create({
          data: {
            action: "PAYMENT_FAILED_WEBHOOK",
            entityType: "Payment",
            entityId: payment.id,
            orderId: payment.orderId,
          },
        }),
      ]);
      break;
    }

    case "refund.processed": {
      const refundEntity = event.payload.refund?.entity;
      if (!refundEntity) break;

      const payment = await prisma.payment.findFirst({
        where: { providerPaymentId: refundEntity.payment_id },
      });
      if (!payment) break;

      await prisma.$transaction([
        prisma.refund.updateMany({
          where: { paymentId: payment.id, providerRefundId: refundEntity.id },
          data: { status: "COMPLETED" },
        }),
        prisma.order.update({ where: { id: payment.orderId }, data: { status: "REFUNDED" } }),
        prisma.auditLog.create({
          data: {
            action: "REFUND_COMPLETED_WEBHOOK",
            entityType: "Refund",
            orderId: payment.orderId,
          },
        }),
      ]);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function restoreStockForOrder(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
    await prisma.inventoryLog.create({
      data: {
        variantId: item.variantId,
        change: item.quantity,
        type: "RESERVATION_RELEASE",
        reason: "Payment failed — stock released",
        orderId,
      },
    });
  }
}
