import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ShippingManager } from "@/components/admin/shipping-manager";

export const metadata: Metadata = { title: "Shipping Rules" };

export default async function AdminShippingPage() {
  const rules = await prisma.shippingRule.findMany({ orderBy: { minOrderValue: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Shipping Configuration</h1>
      <div className="mt-6 max-w-2xl">
        <ShippingManager
          initialRules={rules.map((r) => ({
            id: r.id,
            name: r.name,
            minOrderValue: Number(r.minOrderValue),
            maxOrderValue: r.maxOrderValue ? Number(r.maxOrderValue) : null,
            charge: Number(r.charge),
            estimatedDays: r.estimatedDays,
            isActive: r.isActive,
          }))}
        />
      </div>
    </div>
  );
}
