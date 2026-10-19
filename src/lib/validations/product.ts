import { z } from "zod";

/** Normalizes a URL search param that may arrive as a single string, an array, or absent into a string array. */
const stringArrayParam = z.preprocess((value) => {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}, z.array(z.string()).optional());

export const productVariantInputSchema = z.object({
  size: z.string().trim().min(1).max(20),
  color: z.string().trim().min(1).max(40),
  sku: z.string().trim().min(1).max(64),
  stock: z.number().int().min(0),
  priceOverride: z.number().positive().optional().nullable(),
});
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;

export const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, numbers and hyphens only"),
  description: z.string().trim().min(10).max(5000),
  brandId: z.string().cuid(),
  categoryId: z.string().cuid(),
  basePrice: z.number().positive().max(10_000_000),
  discountPct: z.number().int().min(0).max(90).default(0),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isActive: z.boolean().default(true),
  images: z.array(z.object({ url: z.string().url(), altText: z.string().max(200).optional() })).min(1).max(10),
  variants: z.array(productVariantInputSchema).min(1).max(50),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.string().cuid(),
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const productQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  brand: stringArrayParam,
  category: stringArrayParam,
  size: stringArrayParam,
  color: stringArrayParam,
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating", "popularity"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const reviewCreateSchema = z.object({
  productId: z.string().cuid(),
  authorName: z.string().trim().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
