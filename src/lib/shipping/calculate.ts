import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

const FALLBACK_SHIPPING_CHARGE = 99;
const FALLBACK_ESTIMATED_DAYS = 5;

export const SHIPPING_RULES_CACHE_TAG = "shipping-rules";

// Shipping rules rarely change (admin-edited), but every cart/checkout view needs them —
// caching avoids a fresh Postgres round trip on every single page view. Invalidated
// immediately on create/update/delete via revalidateTag(SHIPPING_RULES_CACHE_TAG).
const getActiveShippingRules = unstable_cache(
  async () =>
    prisma.shippingRule.findMany({
      where: { isActive: true },
      orderBy: { minOrderValue: "desc" },
    }),
  ["active-shipping-rules"],
  { tags: [SHIPPING_RULES_CACHE_TAG], revalidate: 300 }
);

/** Picks the most specific active shipping rule that covers the order subtotal. */
export async function calculateShipping(subtotal: number): Promise<{ charge: number; estimatedDays: number }> {
  const rules = await getActiveShippingRules();

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
