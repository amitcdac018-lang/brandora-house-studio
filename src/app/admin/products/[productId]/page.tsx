import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[productId]">) {
  const { productId } = await params;

  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { position: "asc" } }, variants: true },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Edit Product</h1>
      <div className="mt-6 max-w-3xl rounded-xl border border-brand-cream-dark bg-white p-6">
        <ProductForm
          brands={brands}
          categories={categories}
          existing={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            brandId: product.brandId,
            categoryId: product.categoryId,
            basePrice: Number(product.basePrice),
            discountPct: product.discountPct,
            isFeatured: product.isFeatured,
            isNewArrival: product.isNewArrival,
            isBestSeller: product.isBestSeller,
            isActive: product.isActive,
            images: product.images,
            variants: product.variants.map((v) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              stock: v.stock,
              priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
            })),
          }}
        />
      </div>
    </div>
  );
}
