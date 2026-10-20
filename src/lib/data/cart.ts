import "server-only";
import { prisma } from "@/lib/db";

export async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

export async function getCartWithItems(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } },
          variant: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/** Total item count (sum of quantities) for the header badge — avoids fetching full cart detail. */
export async function getCartItemCount(userId: string): Promise<number> {
  const result = await prisma.cartItem.aggregate({
    where: { cart: { userId } },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}
