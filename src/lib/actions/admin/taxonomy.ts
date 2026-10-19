"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { z } from "zod";

const taxonomySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, numbers and hyphens only"),
  description: z.string().trim().max(1000).optional(),
});

export async function createBrandAction(input: unknown) {
  await requireAdmin();
  const parsed = taxonomySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid brand." };

  const existing = await prisma.brand.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "A brand with this slug already exists." };

  await prisma.brand.create({ data: parsed.data });
  revalidatePath("/admin/brands");
  revalidatePath("/shop");
  return { ok: true };
}

export async function toggleBrandActiveAction(brandId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.brand.update({ where: { id: brandId }, data: { isActive } });
  revalidatePath("/admin/brands");
  revalidatePath("/shop");
  return { ok: true };
}

export async function createCategoryAction(input: unknown) {
  await requireAdmin();
  const parsed = taxonomySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category." };

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "A category with this slug already exists." };

  await prisma.category.create({ data: parsed.data });
  revalidatePath("/admin/brands");
  revalidatePath("/shop");
  return { ok: true };
}

export async function toggleCategoryActiveAction(categoryId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.category.update({ where: { id: categoryId }, data: { isActive } });
  revalidatePath("/admin/brands");
  revalidatePath("/shop");
  return { ok: true };
}
