"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { productCreateSchema, productUpdateSchema } from "@/lib/validations/product";

export async function createProductAction(input: unknown) {
  const admin = await requireAdmin();
  const parsed = productCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product data." };
  }

  const data = parsed.data;

  const existingSlug = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    return { error: "A product with this slug already exists." };
  }

  const existingSkus = await prisma.productVariant.findMany({
    where: { sku: { in: data.variants.map((v) => v.sku) } },
  });
  if (existingSkus.length > 0) {
    return { error: `SKU already in use: ${existingSkus[0].sku}` };
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      brandId: data.brandId,
      categoryId: data.categoryId,
      basePrice: data.basePrice,
      discountPct: data.discountPct,
      isFeatured: data.isFeatured,
      isNewArrival: data.isNewArrival,
      isBestSeller: data.isBestSeller,
      isActive: data.isActive,
      images: { create: data.images.map((img, i) => ({ url: img.url, altText: img.altText, position: i })) },
      variants: { create: data.variants.map((v) => ({ ...v, priceOverride: v.priceOverride ?? undefined })) },
    },
  });

  await prisma.auditLog.create({
    data: { userId: admin.id, action: "PRODUCT_CREATED", entityType: "Product", entityId: product.id },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true, productId: product.id };
}

export async function updateProductAction(input: unknown) {
  const admin = await requireAdmin();
  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product data." };
  }

  const { id, images, variants, ...rest } = parsed.data;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { error: "Product not found." };

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: rest });

    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({
        data: images.map((img, i) => ({ productId: id, url: img.url, altText: img.altText, position: i })),
      });
    }

    if (variants) {
      for (const variant of variants) {
        await tx.productVariant.upsert({
          where: { productId_size_color: { productId: id, size: variant.size, color: variant.color } },
          create: { ...variant, productId: id, priceOverride: variant.priceOverride ?? undefined },
          update: { ...variant, priceOverride: variant.priceOverride ?? undefined },
        });
      }
    }
  });

  await prisma.auditLog.create({
    data: { userId: admin.id, action: "PRODUCT_UPDATED", entityType: "Product", entityId: id },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/product/${existing.slug}`);
  return { ok: true };
}

export async function deleteProductAction(productId: string) {
  const admin = await requireAdmin();

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return { error: "Product not found." };

  await prisma.product.update({ where: { id: productId }, data: { isActive: false } });

  await prisma.auditLog.create({
    data: { userId: admin.id, action: "PRODUCT_DEACTIVATED", entityType: "Product", entityId: productId },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true };
}

export async function updateStockAction(variantId: string, stock: number) {
  const admin = await requireAdmin();

  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "Stock must be a non-negative integer." };
  }

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return { error: "Variant not found." };

  const change = stock - variant.stock;

  await prisma.$transaction([
    prisma.productVariant.update({ where: { id: variantId }, data: { stock } }),
    prisma.inventoryLog.create({
      data: {
        variantId,
        change,
        type: "ADJUSTMENT",
        reason: `Manual adjustment by admin ${admin.email}`,
      },
    }),
  ]);

  revalidatePath("/admin/products");
  return { ok: true };
}
