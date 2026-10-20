import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order History" };

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  PAYMENT_FAILED: "Payment Failed",
};

const statusBadgeClasses: Record<string, string> = {
  PENDING_PAYMENT: "bg-brand-gold-soft text-brand-ink",
  PAID: "bg-brand-success/10 text-brand-success",
  PROCESSING: "bg-brand-gold-soft text-brand-ink",
  SHIPPED: "bg-brand-gold-soft text-brand-ink",
  DELIVERED: "bg-brand-success/10 text-brand-success",
  CANCELLED: "bg-brand-danger/10 text-brand-danger",
  REFUNDED: "bg-brand-danger/10 text-brand-danger",
  PAYMENT_FAILED: "bg-brand-danger/10 text-brand-danger",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-brand-ink">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-brand-cream-dark p-10 text-center">
          <p className="text-brand-ink-soft">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-md bg-brand-ink px-6 py-2.5 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const firstItem = order.items[0];
            const firstImage = firstItem?.product.images[0];
            const extraCount = order.items.length - 1;

            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block rounded-xl border border-brand-cream-dark bg-white p-4 transition-colors hover:border-brand-gold sm:p-5"
              >
                <div className="flex items-center justify-between border-b border-brand-cream-dark pb-3 text-xs text-brand-ink-soft">
                  <span>
                    Ordered on{" "}
                    {order.createdAt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span>{order.orderNumber}</span>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-brand-cream-dark">
                    {firstImage && (
                      <Image src={firstImage.url} alt={firstItem.nameSnapshot} fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-ink">{firstItem?.nameSnapshot}</p>
                    <p className="text-xs text-brand-ink-soft">
                      {extraCount > 0 ? `+ ${extraCount} more item${extraCount > 1 ? "s" : ""}` : "1 item"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-brand-ink">{formatPrice(Number(order.grandTotal))}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusBadgeClasses[order.status] ?? "bg-brand-gold-soft text-brand-ink"
                      }`}
                    >
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
