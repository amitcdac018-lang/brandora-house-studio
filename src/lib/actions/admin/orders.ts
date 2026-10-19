"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { getRazorpayClient } from "@/lib/payments/razorpay";
import { createShiprocketOrder, assignAwb, cancelShiprocketOrder } from "@/lib/shipping/shiprocket/client";
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

const createShiprocketShipmentSchema = z.object({
  orderId: z.string().cuid(),
  weightKg: z.number().positive().max(200).default(0.5),
  lengthCm: z.number().positive().max(300).default(20),
  breadthCm: z.number().positive().max(300).default(15),
  heightCm: z.number().positive().max(300).default(10),
});

/**
 * Books a real shipment through Shiprocket: creates the order on their side, then
 * auto-assigns a courier to get a real AWB (tracking number). Falls back to manual
 * entry (createShipmentAction) if Shiprocket isn't configured or the call fails.
 */
export async function createShiprocketShipmentAction(input: unknown) {
  const admin = await requireAdmin();
  const parsed = createShiprocketShipmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid shipment details." };

  const { orderId, weightKg, lengthCm, breadthCm, heightCm } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true, user: true },
  });
  if (!order) return { error: "Order not found." };

  const pickupLocationLabel = process.env.SHIPROCKET_PICKUP_LOCATION;
  if (!pickupLocationLabel) {
    return { error: "Shiprocket pickup location is not configured (SHIPROCKET_PICKUP_LOCATION)." };
  }

  try {
    const created = await createShiprocketOrder({
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      pickupLocationLabel,
      billing: {
        customerName: order.address.fullName,
        address: order.address.line1 + (order.address.line2 ? `, ${order.address.line2}` : ""),
        city: order.address.city,
        pincode: order.address.postalCode,
        state: order.address.state,
        phone: order.address.phone,
        email: order.user.email,
      },
      items: order.items.map((item) => ({
        name: item.nameSnapshot,
        sku: item.skuSnapshot,
        units: item.quantity,
        selling_price: Number(item.unitPrice),
      })),
      subTotal: Number(order.subtotal),
      paymentMethod: "Prepaid",
      dimensions: { lengthCm, breadthCm, heightCm, weightKg },
    });

    const awbResult = await assignAwb(created.shipment_id);

    await prisma.$transaction([
      prisma.shipment.create({
        data: {
          orderId,
          provider: "SHIPROCKET",
          carrier: awbResult.courier_name,
          courierName: awbResult.courier_name,
          trackingNumber: awbResult.awb_code,
          status: "PACKED",
          shiprocketOrderId: String(created.order_id),
          shiprocketShipmentId: String(created.shipment_id),
        },
      }),
      prisma.order.update({ where: { id: orderId }, data: { status: "PROCESSING" } }),
      prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: "SHIPROCKET_SHIPMENT_CREATED",
          entityType: "Order",
          entityId: orderId,
          orderId,
          metadata: { shiprocketOrderId: created.order_id, awb: awbResult.awb_code },
        },
      }),
    ]);

    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true, awb: awbResult.awb_code, courier: awbResult.courier_name };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create Shiprocket shipment.",
    };
  }
}

const cancelShipmentSchema = z.object({
  shipmentId: z.string().cuid(),
});

export async function cancelShiprocketShipmentAction(input: unknown) {
  const admin = await requireAdmin();
  const parsed = cancelShipmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };

  const shipment = await prisma.shipment.findUnique({ where: { id: parsed.data.shipmentId } });
  if (!shipment) return { error: "Shipment not found." };
  if (shipment.provider !== "SHIPROCKET" || !shipment.shiprocketOrderId) {
    return { error: "Only Shiprocket-booked shipments can be cancelled here." };
  }

  try {
    await cancelShiprocketOrder(shipment.shiprocketOrderId);

    await prisma.$transaction([
      prisma.shipment.update({ where: { id: shipment.id }, data: { status: "CANCELLED" } }),
      prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: "SHIPROCKET_SHIPMENT_CANCELLED",
          entityType: "Shipment",
          entityId: shipment.id,
          orderId: shipment.orderId,
        },
      }),
    ]);

    revalidatePath(`/admin/orders/${shipment.orderId}`);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not cancel shipment." };
  }
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
