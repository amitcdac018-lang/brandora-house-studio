import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ProductCard } from "@/components/shop/product-card";

type RailProduct = Prisma.ProductGetPayload<{
  include: { brand: true; images: { orderBy: { position: "asc" }; take: 1 } };
}>;

export function ProductRail({
  title,
  products,
  viewAllHref,
}: {
  title: string;
  products: RailProduct[];
  viewAllHref: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-brand-ink">{title}</h2>
        <Link href={viewAllHref} className="text-sm font-medium text-brand-gold hover:underline">
          View all
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
