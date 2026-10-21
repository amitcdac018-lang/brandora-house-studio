import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Pagination } from "@/components/shop/pagination";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 50;

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

      <Pagination page={page} totalPages={totalPages} searchParams={resolvedSearchParams} />
    </div>
  );
}
