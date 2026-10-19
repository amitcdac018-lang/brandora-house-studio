import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Add Product</h1>
      <div className="mt-6 max-w-3xl rounded-xl border border-brand-cream-dark bg-white p-6">
        <ProductForm brands={brands} categories={categories} />
      </div>
    </div>
  );
}
