import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { productQuerySchema, type ProductQueryInput } from "@/lib/validations/product";

const sortToOrderBy: Record<ProductQueryInput["sort"], Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { basePrice: "asc" },
  price_desc: { basePrice: "desc" },
  rating: { avgRating: "desc" },
  popularity: { ratingCount: "desc" },
};

export async function getProductFilters() {
  const [brands, categories, variants] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      select: { size: true, color: true },
      distinct: ["size", "color"],
    }),
  ]);

  const sizes = Array.from(new Set(variants.map((v) => v.size))).sort();
  const colors = Array.from(new Set(variants.map((v) => v.color))).sort();

  return { brands, categories, sizes, colors };
}

export async function listProducts(rawQuery: unknown) {
  const query = productQuerySchema.parse(rawQuery);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(query.q && {
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ],
    }),
    ...(query.brand?.length && { brand: { slug: { in: query.brand } } }),
    ...(query.category?.length && { category: { slug: { in: query.category } } }),
    ...((query.size?.length || query.color?.length) && {
      variants: {
        some: {
          isActive: true,
          ...(query.size?.length && { size: { in: query.size } }),
          ...(query.color?.length && { color: { in: query.color } }),
        },
      },
    }),
    ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
      basePrice: {
        ...(query.minPrice !== undefined && { gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
      },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: sortToOrderBy[query.sort],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        brand: true,
        category: true,
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { where: { isActive: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: { where: { isActive: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { brand: true, images: { orderBy: { position: "asc" }, take: 1 } },
  });
}

export async function getNewArrivals(limit = 8) {
  return prisma.product.findMany({
    where: { isActive: true, isNewArrival: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { brand: true, images: { orderBy: { position: "asc" }, take: 1 } },
  });
}

export async function getBestSellers(limit = 8) {
  return prisma.product.findMany({
    where: { isActive: true, isBestSeller: true },
    take: limit,
    orderBy: { ratingCount: "desc" },
    include: { brand: true, images: { orderBy: { position: "asc" }, take: 1 } },
  });
}
