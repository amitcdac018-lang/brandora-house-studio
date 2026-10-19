"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { z } from "zod";

const settingSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.string().trim().max(2000),
});

export async function updateSiteSettingAction(input: unknown) {
  await requireAdmin();
  const parsed = settingSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid setting." };

  await prisma.siteSetting.upsert({
    where: { key: parsed.data.key },
    create: parsed.data,
    update: { value: parsed.data.value },
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}
