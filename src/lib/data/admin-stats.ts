import "server-only";
import { prisma } from "@/lib/db";

export async function getDashboardStats() {
  const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalOrders, pendingOrders, totalCustomers, revenueResult, lowStockVariants, recentOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PENDING_PAYMENT", "PROCESSING"] } } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] }, createdAt: { gte: since30Days } },
        _sum: { grandTotal: true },
      }),
      prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 }, isActive: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: true },
      }),
    ]);

  return {
    totalOrders,
    pendingOrders,
    totalCustomers,
    revenueLast30Days: Number(revenueResult._sum.grandTotal ?? 0),
    lowStockVariants,
    recentOrders,
  };
}
