import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardStats } from "@/lib/data/admin-stats";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Revenue (30 days)", value: formatPrice(stats.revenueLast30Days) },
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Pending Orders", value: stats.pendingOrders },
    { label: "Total Customers", value: stats.totalCustomers },
    { label: "Low Stock Variants", value: stats.lowStockVariants },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-brand-cream-dark bg-white p-5">
            <p className="text-sm text-brand-ink-soft">{card.label}</p>
            <p className="mt-2 font-display text-2xl text-brand-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-brand-cream-dark bg-white p-5">
        <h2 className="font-semibold text-brand-ink">Recent Orders</h2>
        <div className="mt-4 space-y-3">
          {stats.recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between rounded-md border border-brand-cream-dark p-3 hover:border-brand-gold"
            >
              <div>
                <p className="font-medium text-brand-ink">{order.orderNumber}</p>
                <p className="text-sm text-brand-ink-soft">{order.user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-brand-ink">{formatPrice(Number(order.grandTotal))}</p>
                <p className="text-sm text-brand-gold">{order.status}</p>
              </div>
            </Link>
          ))}
          {stats.recentOrders.length === 0 && (
            <p className="text-sm text-brand-ink-soft">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
