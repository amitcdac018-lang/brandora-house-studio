"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { getOrCreateCart } from "@/lib/data/cart";
import { addToCartSchema, updateCartItemSchema, removeCartItemSchema } from "@/lib/validations/cart";

export async function addToCartAction(input: unknown) {
  const user = await requireUser();
  const { productId, variantId, quantity } = addToCartSchema.parse(input);

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant || !variant.isActive || variant.productId !== productId || !variant.product.isActive) {
    return { error: "This product is no longer available." };
  }

  if (variant.stock < quantity) {
    return { error: `Only ${variant.stock} left in stock.` };
  }

  const cart = await getOrCreateCart(user.id);

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  const nextQuantity = (existingItem?.quantity ?? 0) + quantity;
  if (nextQuantity > variant.stock) {
    return { error: `Only ${variant.stock} left in stock.` };
  }
  if (nextQuantity > 10) {
    return { error: "Maximum 10 units per item." };
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, productId, variantId, quantity },
    update: { quantity: nextQuantity },
  });

  revalidatePath("/cart");
  return { ok: true };
}

export async function updateCartItemAction(input: unknown) {
  const user = await requireUser();
  const { cartItemId, quantity } = updateCartItemSchema.parse(input);

  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true, variant: true },
  });

  if (!item || item.cart.userId !== user.id) {
    return { error: "Cart item not found." };
  }

  if (quantity > item.variant.stock) {
    return { error: `Only ${item.variant.stock} left in stock.` };
  }

  await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
  revalidatePath("/cart");
  return { ok: true };
}

export async function removeCartItemAction(input: unknown) {
  const user = await requireUser();
  const { cartItemId } = removeCartItemSchema.parse(input);

  const item = await prisma.cartItem.findUnique({ where: { id: cartItemId }, include: { cart: true } });
  if (!item || item.cart.userId !== user.id) {
    return { error: "Cart item not found." };
  }

  await prisma.cartItem.delete({ where: { id: cartItemId } });
  revalidatePath("/cart");
  return { ok: true };
}
