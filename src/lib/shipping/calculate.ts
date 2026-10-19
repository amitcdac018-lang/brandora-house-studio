import "server-only";
import { prisma } from "@/lib/db";

const FALLBACK_SHIPPING_CHARGE = 99;
const FALLBACK_ESTIMATED_DAYS = 5;

/** Picks the most specific active shipping rule that covers the order subtotal. */
export async function calculateShipping(subtotal: number): Promise<{ charge: number; estimatedDays: number }> {
  const rules = await prisma.shippingRule.findMany({
    where: { isActive: true },
    orderBy: { minOrderValue: "desc" },
  });

  const matchingRule = rules.find((rule) => {
    const min = Number(rule.minOrderValue);
    const max = rule.maxOrderValue !== null ? Number(rule.maxOrderValue) : null;
    return subtotal >= min && (max === null || subtotal <= max);
  });

  if (!matchingRule) {
    return { charge: FALLBACK_SHIPPING_CHARGE, estimatedDays: FALLBACK_ESTIMATED_DAYS };
  }

  return { charge: Number(matchingRule.charge), estimatedDays: matchingRule.estimatedDays };
}
