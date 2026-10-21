import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { Pagination } from "@/components/shop/pagination";

export const metadata: Metadata = { title: "Manage Products" };

const PAGE_SIZE = 50;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { brand: true, variants: { select: { stock: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-ink">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft"
        >
          + Add Product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-cream-dark bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-cream-dark text-left text-brand-ink-soft">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <tr key={product.id} className="border-b border-brand-cream-dark last:border-0">
                  <td className="p-3 font-medium text-brand-ink">{product.name}</td>
                  <td className="p-3 text-brand-ink-soft">{product.brand.name}</td>
                  <td className="p-3 text-brand-ink-soft">{formatPrice(Number(product.basePrice))}</td>
                  <td className="p-3 text-brand-ink-soft">{totalStock}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        product.isActive ? "bg-brand-success/10 text-brand-success" : "bg-brand-danger/10 text-brand-danger"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/products/${product.id}`} className="text-brand-gold hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="p-6 text-center text-brand-ink-soft">No products yet.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} searchParams={resolvedSearchParams} />
    </div>
  );
}
