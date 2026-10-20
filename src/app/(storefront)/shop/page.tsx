import type { Metadata } from "next";
import { Suspense } from "react";
import { listProducts, getProductFilters } from "@/lib/data/products";
import { ShopFilters } from "@/components/shop/shop-filters";
import { ProductGrid } from "@/components/shop/product-grid";
import { SortSelect } from "@/components/shop/sort-select";
import { Pagination } from "@/components/shop/pagination";
import { SearchBox } from "@/components/shop/search-box";

export const metadata: Metadata = {
  title: "Shop All Shoes",
  description: "Browse premium footwear from Campus, Nike, Aqualite and Action Shoes.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const resolvedSearchParams = await searchParams;

  const [result, filters] = await Promise.all([
    listProducts(resolvedSearchParams),
    getProductFilters(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-brand-ink">Shop All Shoes</h1>
        <p className="mt-1 text-sm text-brand-ink-soft">{result.total} products</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <SearchBox defaultValue={resolvedSearchParams.q as string | undefined} />
          <div className="mt-6">
            <ShopFilters
              brands={filters.brands}
              categories={filters.categories}
              sizes={filters.sizes}
              colors={filters.colors}
              searchParams={resolvedSearchParams}
            />
          </div>
        </aside>

        <div>
          <div className="mb-4 flex justify-end">
            <Suspense fallback={null}>
              <SortSelect current={(resolvedSearchParams.sort as string) ?? "newest"} />
            </Suspense>
          </div>

          <ProductGrid products={result.items} />

          <Pagination page={result.page} totalPages={result.totalPages} searchParams={resolvedSearchParams} />
        </div>
      </div>
    </div>
  );
}
