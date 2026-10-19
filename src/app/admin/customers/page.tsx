import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Customers</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-cream-dark bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-cream-dark text-left text-brand-ink-soft">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-brand-cream-dark last:border-0">
                <td className="p-3 font-medium text-brand-ink">{customer.name ?? "—"}</td>
                <td className="p-3 text-brand-ink-soft">{customer.email}</td>
                <td className="p-3 text-brand-ink-soft">{customer._count.orders}</td>
                <td className="p-3 text-brand-ink-soft">{new Date(customer.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="p-6 text-center text-brand-ink-soft">No customers yet.</p>}
      </div>
    </div>
  );
}
