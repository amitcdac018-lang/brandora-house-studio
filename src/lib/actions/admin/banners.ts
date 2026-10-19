"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { z } from "zod";

const bannerSchema = z.object({
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().trim().max(300).optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.number().int().min(0).default(0),
});

export async function createBannerAction(input: unknown) {
  await requireAdmin();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid banner." };

  await prisma.banner.create({ data: parsed.data });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleBannerActiveAction(id: string, isActive: boolean) {
  await requireAdmin();
  await prisma.banner.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBannerAction(id: string) {
  await requireAdmin();
  await prisma.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}
