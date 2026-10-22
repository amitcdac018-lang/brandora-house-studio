"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth/guards";
import { addressSchema } from "@/lib/validations/checkout";

/**
 * A delete blocked by Order_addressId_fkey's ON DELETE RESTRICT doesn't reliably surface
 * as Prisma's structured P2003 PrismaClientKnownRequestError — in production this came
 * through instead as a PrismaClientUnknownRequestError wrapping the raw Postgres error
 * (SQLSTATE 23001 "restrict_violation", message "violates RESTRICT setting of foreign key
 * constraint"), which `instanceof ... && error.code === "P2003"` never matches. Check both
 * shapes: the structured code when Prisma does provide one, and the Postgres error text
 * (which is standard wording, not tied to this one constraint name) as a fallback.
 */
function isForeignKeyRestrictError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    return true;
  }
  if (error instanceof Error) {
    return /foreign key constraint|violates.*restrict/i.test(error.message);
  }
  return false;
}

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
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { error: "Please sign in to manage your addresses." };
    }
    throw error;
  }

  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== user.id) {
    return { error: "Address not found." };
  }

  try {
    await prisma.address.delete({ where: { id: addressId } });
  } catch (error) {
    if (isForeignKeyRestrictError(error)) {
      // This address is still referenced by at least one order (Order.addressId has no
      // onDelete: Cascade, by design: deleting an address must never silently corrupt a
      // past order's shipping record). Surface a clear, actionable message instead of
      // letting the raw DB error crash the page.
      return { error: "This address is used on a past order and can't be deleted. You can add a new address instead." };
    }
    throw error;
  }

  revalidatePath("/account/addresses");
  return { ok: true };
}
