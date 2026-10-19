import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Manage Orders" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Orders</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-cream-dark bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-cream-dark text-left text-brand-ink-soft">
            <tr>
              <th className="p-3">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-brand-cream-dark last:border-0">
                <td className="p-3 font-medium text-brand-ink">{order.orderNumber}</td>
                <td className="p-3 text-brand-ink-soft">{order.user.email}</td>
                <td className="p-3 text-brand-ink-soft">{formatPrice(Number(order.grandTotal))}</td>
                <td className="p-3">
                  <span className="rounded-full bg-brand-gold-soft px-2 py-0.5 text-xs text-brand-ink">
                    {order.status}
                  </span>
                </td>
                <td className="p-3 text-brand-ink-soft">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/orders/${order.id}`} className="text-brand-gold hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-brand-ink-soft">No orders yet.</p>}
      </div>
    </div>
  );
}
