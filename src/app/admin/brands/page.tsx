import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import {
  createBrandAction,
  toggleBrandActiveAction,
  createCategoryAction,
  toggleCategoryActiveAction,
} from "@/lib/actions/admin/taxonomy";

export const metadata: Metadata = { title: "Brands & Categories" };

export default async function AdminBrandsPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Brands & Categories</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaxonomyManager title="Brands" items={brands} onCreate={createBrandAction} onToggle={toggleBrandActiveAction} />
        <TaxonomyManager
          title="Categories"
          items={categories}
          onCreate={createCategoryAction}
          onToggle={toggleCategoryActiveAction}
        />
      </div>
    </div>
  );
}
