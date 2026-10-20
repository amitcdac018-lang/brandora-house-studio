import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Sales Reports" };

export default async function AdminReportsPage() {
  const paidStatuses: ("PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED")[] = [
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ];

  const [byStatus, byBrand, totalRevenue] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, _sum: { grandTotal: true } }),
    // Only count items from orders that were actually paid for — a PENDING_PAYMENT or
    // PAYMENT_FAILED order never resulted in a real sale and must not inflate "units sold".
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: { in: paidStatuses } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.order.aggregate({
      where: { status: { in: paidStatuses } },
      _sum: { grandTotal: true },
    }),
  ]);

  const topProducts = await prisma.product.findMany({
    where: { id: { in: byBrand.map((b) => b.productId) } },
    select: { id: true, name: true },
  });
  const topProductMap = new Map(topProducts.map((p) => [p.id, p.name]));

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Sales Reports</h1>

      <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-5">
        <p className="text-sm text-brand-ink-soft">Total Revenue (Paid+)</p>
        <p className="mt-1 font-display text-2xl text-brand-ink">
          {formatPrice(Number(totalRevenue._sum.grandTotal ?? 0))}
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-5">
        <h2 className="font-semibold text-brand-ink">Orders by Status</h2>
        <div className="mt-3 space-y-2 text-sm">
          {byStatus.map((group) => (
            <div key={group.status} className="flex justify-between">
              <span className="text-brand-ink-soft">{group.status}</span>
              <span className="text-brand-ink">
                {group._count._all} orders · {formatPrice(Number(group._sum.grandTotal ?? 0))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-5">
        <h2 className="font-semibold text-brand-ink">Top Selling Products</h2>
        <div className="mt-3 space-y-2 text-sm">
          {byBrand.map((group) => (
            <div key={group.productId} className="flex justify-between">
              <span className="text-brand-ink-soft">{topProductMap.get(group.productId) ?? "Unknown"}</span>
              <span className="text-brand-ink">{group._sum.quantity} sold</span>
            </div>
          ))}
          {byBrand.length === 0 && <p className="text-brand-ink-soft">No sales data yet.</p>}
        </div>
      </div>
    </div>
  );
}
