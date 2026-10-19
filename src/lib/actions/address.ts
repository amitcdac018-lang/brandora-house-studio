"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { addressSchema } from "@/lib/validations/checkout";

export async function createAddressAction(input: unknown) {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid address." };
  }

  const data = parsed.data;

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({ data: { ...data, userId: user.id } });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, addressId: address.id };
}

export async function deleteAddressAction(addressId: string) {
  const user = await requireUser();

  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== user.id) {
    return { error: "Address not found." };
  }

  await prisma.address.delete({ where: { id: addressId } });
  revalidatePath("/account/addresses");
  return { ok: true };
}
