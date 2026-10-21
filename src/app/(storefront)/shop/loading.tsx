import { ProductGridSkeleton } from "@/components/shop/product-grid-skeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-8 w-56 animate-pulse rounded bg-brand-cream-dark" />
        <div className="mt-2 h-4 w-24 animate-pulse rounded bg-brand-cream-dark" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="h-64 animate-pulse rounded-lg bg-brand-cream-dark" />
        </aside>
        <div>
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
