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

/**
 * Razorpay's Node SDK typically rejects with { statusCode, error: { description, code, ... } }
 * rather than a plain Error — surface that description when present so the real cause (bad
 * credentials, invalid amount, etc.) isn't hidden behind "Could not start payment."
 */
function describeRazorpayError(err: unknown): string {
  if (err && typeof err === "object") {
    const maybeRazorpay = err as { error?: { description?: string; code?: string }; statusCode?: number };
    if (maybeRazorpay.error?.description) {
      return `${maybeRazorpay.error.description}${maybeRazorpay.error.code ? ` (${maybeRazorpay.error.code})` : ""}`;
    }
  }
  if (err instanceof Error) return err.message;
  // TEMPORARY diagnostic fallback — remove once the real failure cause is identified.
  // Safe to surface: this is whatever the Razorpay SDK threw, never our own secret values.
  return `[unrecognized error shape] ${safeJsonStringify(err)}`;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, Object.getOwnPropertyNames(value as object));
  } catch {
    return String(value);
  }
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

    let razorpayOrder;
    try {
      const razorpay = getRazorpayClient();
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(Number(order.grandTotal) * 100),
        currency: "INR",
        receipt: order.orderNumber,
        notes: { orderId: order.id, userId: user.id },
      });
    } catch (razorpayError) {
      // The order + stock reservation already committed above. If we can't reach Razorpay,
      // we must undo both rather than leave stock locked against an order nobody can pay for.
      console.error(
        "Razorpay order creation failed:",
        razorpayError,
        "| typeof:",
        typeof razorpayError,
        "| JSON:",
        safeJsonStringify(razorpayError)
      );
      await releaseOrderReservation(order.id);
      return {
        error: `Could not start payment: ${describeRazorpayError(razorpayError)}`,
      };
    }

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

/**
 * Undoes a pending order's stock reservation and marks it failed when payment could never be
 * started (e.g. the Razorpay API call itself failed). Cart items are intentionally not restored —
 * the customer is redirected back to the cart/shop to re-add items, which is simpler and safer
 * than reconstructing a cart snapshot that may now conflict with updated stock or pricing.
 */
async function releaseOrderReservation(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.inventoryLog.create({
        data: {
          variantId: item.variantId,
          change: item.quantity,
          type: "RESERVATION_RELEASE",
          reason: "Payment could not be initiated",
          orderId,
        },
      });
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "PAYMENT_FAILED" } });
  });
}
