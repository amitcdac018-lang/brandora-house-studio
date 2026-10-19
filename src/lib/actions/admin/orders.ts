"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { getRazorpayClient } from "@/lib/payments/razorpay";
import { z } from "zod";

const orderStatusValues = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "PAYMENT_FAILED",
] as const;

const updateOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: z.enum(orderStatusValues),
});

export async function updateOrderStatusAction(input: unknown) {
  const admin = await requireAdmin();
  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status update." };

  const { orderId, status } = parsed.data;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "ORDER_STATUS_UPDATED",
        entityType: "Order",
        entityId: orderId,
        orderId,
        metadata: { from: order.status, to: status },
      },
    }),
  ]);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

const createShipmentSchema = z.object({
  orderId: z.string().cuid(),
  carrier: z.string().trim().min(1).max(100),
  trackingNumber: z.string().trim().min(1).max(100),
});

export async function createShipmentAction(input: unknown) {
  const admin = await requireAdmin();
  const parsed = createShipmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid shipment details." };

  const { orderId, carrier, trackingNumber } = parsed.data;

  await prisma.$transaction([
    prisma.shipment.create({
      data: { orderId, carrier, trackingNumber, status: "SHIPPED", shippedAt: new Date() },
    }),
    prisma.order.update({ where: { id: orderId }, data: { status: "SHIPPED" } }),
    prisma.auditLog.create({
      data: { userId: admin.id, action: "SHIPMENT_CREATED", entityType: "Order", entityId: orderId, orderId },
    }),
  ]);

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

const refundOrderSchema = z.object({
  orderId: z.string().cuid(),
  amount: z.number().positive(),
  reason: z.string().trim().max(500).optional(),
});

export async function refundOrderAction(input: unknown) {
  const admin = await requireAdmin();
  const parsed = refundOrderSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid refund request." };

  const { orderId, amount, reason } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order) return { error: "Order not found." };

  const capturedPayment = order.payments.find((p) => p.status === "CAPTURED" && p.providerPaymentId);
  if (!capturedPayment?.providerPaymentId) {
    return { error: "No captured payment found for this order." };
  }

  if (amount > Number(capturedPayment.amount)) {
    return { error: "Refund amount cannot exceed the captured payment amount." };
  }

  try {
    const razorpay = getRazorpayClient();
    const providerRefund = await razorpay.payments.refund(capturedPayment.providerPaymentId, {
      amount: Math.round(amount * 100),
    });

    await prisma.$transaction([
      prisma.refund.create({
        data: {
          orderId,
          paymentId: capturedPayment.id,
          providerRefundId: providerRefund.id,
          amount,
          reason,
          status: "PROCESSING",
        },
      }),
      prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } }),
      prisma.auditLog.create({
        data: { userId: admin.id, action: "REFUND_INITIATED", entityType: "Order", entityId: orderId, orderId },
      }),
    ]);

    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Refund failed." };
  }
}
