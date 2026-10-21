"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { SHIPPING_RULES_CACHE_TAG } from "@/lib/shipping/calculate";
import { z } from "zod";

const shippingRuleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  minOrderValue: z.number().min(0),
  maxOrderValue: z.number().positive().optional().nullable(),
  charge: z.number().min(0),
  estimatedDays: z.number().int().min(1).max(60),
});

export async function createShippingRuleAction(input: unknown) {
  await requireAdmin();
  const parsed = shippingRuleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid shipping rule." };

  await prisma.shippingRule.create({ data: parsed.data });
  revalidatePath("/admin/shipping");
  updateTag(SHIPPING_RULES_CACHE_TAG);
  return { ok: true };
}

export async function toggleShippingRuleAction(id: string, isActive: boolean) {
  await requireAdmin();
  await prisma.shippingRule.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/shipping");
  updateTag(SHIPPING_RULES_CACHE_TAG);
  return { ok: true };
}

export async function deleteShippingRuleAction(id: string) {
  await requireAdmin();
  await prisma.shippingRule.delete({ where: { id } });
  revalidatePath("/admin/shipping");
  updateTag(SHIPPING_RULES_CACHE_TAG);
  return { ok: true };
}
