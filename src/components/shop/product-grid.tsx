import type { Prisma } from "@prisma/client";
import { ProductCard } from "./product-card";

type ListedProduct = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    category: true;
    images: { orderBy: { position: "asc" }; take: 1 };
    variants: true;
  };
}>;

export function ProductGrid({ products }: { products: ListedProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-cream-dark p-12 text-center text-brand-ink-soft">
        No products match your filters. Try adjusting your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
