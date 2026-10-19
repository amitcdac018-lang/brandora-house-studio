"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { getCartWithItems } from "@/lib/data/cart";
import { calculateShipping } from "@/lib/shipping/calculate";
import { getRazorpayClient } from "@/lib/payments/razorpay";
import { createOrderSchema } from "@/lib/validations/checkout";
import { rateLimit } from "@/lib/rate-limit";
import { discountedPrice } from "@/lib/format";

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BHS-${stamp}-${random}`;
}

export async function createOrderAction(input: unknown) {
  const user = await requireUser();
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid checkout request." };
  }
  const { addressId, idempotencyKey } = parsed.data;

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await rateLimit(`checkout:${user.id}:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!success) {
    return { error: "Too many checkout attempts. Please wait and try again." };
  }

  // Idempotency: if this exact key already produced an order, return it instead of creating a duplicate.
  const existingOrder = await prisma.order.findUnique({ where: { idempotencyKey } });
  if (existingOrder) {
    const payment = await prisma.payment.findFirst({ where: { orderId: existingOrder.id } });
    return { ok: true, orderId: existingOrder.id, razorpayOrderId: payment?.providerOrderId };
  }

  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== user.id) {
    return { error: "Shipping address not found." };
  }

  const cart = await getCartWithItems(user.id);
  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty." };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Re-fetch and lock-by-check each variant's live stock/price inside the transaction —
      // never trust cart snapshot or client-submitted values for money or inventory.
      let subtotal = 0;
      const orderItemsData: {
        productId: string;
        variantId: string;
        nameSnapshot: string;
        skuSnapshot: string;
        sizeSnapshot: string;
        colorSnapshot: string;
        unitPrice: number;
        quantity: number;
      }[] = [];

      for (const item of cart.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant || !variant.isActive || !variant.product.isActive) {
          throw new Error(`"${item.product.name}" is no longer available.`);
        }
        if (variant.stock < item.quantity) {
          throw new Error(`Only ${variant.stock} left in stock for "${item.product.name}" (${variant.size}/${variant.color}).`);
        }

        const unitPrice = variant.priceOverride
          ? Number(variant.priceOverride)
          : discountedPrice(Number(variant.product.basePrice), variant.product.discountPct);

        subtotal += unitPrice * item.quantity;

        orderItemsData.push({
          productId: variant.productId,
          variantId: variant.id,
          nameSnapshot: variant.product.name,
          skuSnapshot: variant.sku,
          sizeSnapshot: variant.size,
          colorSnapshot: variant.color,
          unitPrice,
          quantity: item.quantity,
        });

        // Reserve stock immediately to prevent overselling between order creation and payment capture.
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            change: -item.quantity,
            type: "RESERVATION",
            reason: "Order checkout reservation",
          },
        });
      }

      const { charge: shippingCharge, estimatedDays } = await calculateShipping(subtotal);
      const grandTotal = subtotal + shippingCharge;

      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: user.id,
          addressId,
          status: "PENDING_PAYMENT",
          subtotal,
          shippingCharge,
          grandTotal,
          idempotencyKey,
          estimatedDeliveryAt: new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000),
          items: { create: orderItemsData },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.grandTotal) * 100),
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderId: order.id, userId: user.id },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "razorpay",
        providerOrderId: razorpayOrder.id,
        status: "CREATED",
        amount: order.grandTotal,
        currency: "INR",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ORDER_CREATED",
        entityType: "Order",
        entityId: order.id,
        orderId: order.id,
      },
    });

    return { ok: true, orderId: order.id, razorpayOrderId: razorpayOrder.id, amount: Number(order.grandTotal) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create order." };
  }
}
