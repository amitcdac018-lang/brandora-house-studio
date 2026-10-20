import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, MapPin, Truck, AlertCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { OrderTimeline } from "@/components/account/order-timeline";

export const metadata: Metadata = { title: "Order Details" };

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

const statusDescriptions: Record<string, string> = {
  PENDING_PAYMENT: "We're waiting for your payment to complete.",
  PAID: "Payment received — we're getting your order ready.",
  PROCESSING: "Your order is being packed for shipment.",
  SHIPPED: "On its way to you.",
  DELIVERED: "This order has been delivered.",
  CANCELLED: "This order was cancelled.",
  REFUNDED: "This order was refunded.",
  PAYMENT_FAILED: "Payment did not go through — no charge was made.",
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

export default async function OrderDetailPage({
  params,
  searchParams,
}: PageProps<"/account/orders/[orderId]">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { orderId } = await params;
  const resolvedSearchParams = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } } },
      address: true,
      shipments: { orderBy: { createdAt: "desc" } },
      payments: true,
    },
  });

  if (!order || order.userId !== session.user.id) notFound();

  const activeShipment = order.shipments[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {resolvedSearchParams.verification_failed && (
        <div className="mb-6 rounded-md bg-brand-danger/10 p-4 text-sm text-brand-danger">
          We couldn&apos;t verify your payment. If money was deducted, it will be refunded automatically.
        </div>
      )}
      {resolvedSearchParams.cancelled && (
        <div className="mb-6 rounded-md bg-brand-gold-soft p-4 text-sm text-brand-ink">
          Payment was cancelled. You can retry from your order history.
        </div>
      )}
      {resolvedSearchParams.success && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-brand-success/10 p-4 text-sm text-brand-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Payment successful! Your order is confirmed.
        </div>
      )}
      {order.status === "PAYMENT_FAILED" && (
        <div className="mb-6 flex items-start gap-3 rounded-md bg-brand-danger/10 p-4 text-sm text-brand-danger">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">This order was not completed — payment did not go through.</p>
            <p className="mt-1">
              No charge was made and the items were released back into stock. You can add them to your cart again
              and check out whenever you&apos;re ready.
            </p>
            <Link href="/shop" className="mt-2 inline-block font-semibold underline hover:no-underline">
              Browse the shop to re-order
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-brand-ink-soft">Order Number</p>
          <h1 className="font-display text-2xl text-brand-ink">{order.orderNumber}</h1>
          <p className="mt-1 text-xs text-brand-ink-soft">
            Placed on{" "}
            {order.createdAt.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClasses[order.status] ?? "bg-brand-gold-soft text-brand-ink"}`}>
          {statusLabels[order.status] ?? order.status}
        </span>
      </div>
      {statusDescriptions[order.status] && (
        <p className="mt-1 text-right text-xs text-brand-ink-soft">{statusDescriptions[order.status]}</p>
      )}

      {/* Visual progress timeline — Amazon/Flipkart-style tracker */}
      <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-6">
        <OrderTimeline
          status={order.status}
          createdAt={order.createdAt}
          shippedAt={activeShipment?.shippedAt ?? null}
          deliveredAt={activeShipment?.deliveredAt ?? null}
        />

        {activeShipment && (
          <div className="mt-6 flex items-start gap-3 rounded-lg bg-brand-cream p-4">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
            <div className="text-sm">
              <p className="font-medium text-brand-ink">
                {activeShipment.courierName ?? activeShipment.carrier ?? "Courier"}
                {activeShipment.trackingNumber && (
                  <span className="ml-2 font-normal text-brand-ink-soft">
                    AWB: {activeShipment.trackingNumber}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-brand-gold">{activeShipment.status.replace(/_/g, " ")}</p>
            </div>
          </div>
        )}

        {!activeShipment && order.estimatedDeliveryAt && order.status !== "CANCELLED" && (
          <p className="mt-6 text-center text-sm text-brand-ink-soft">
            Estimated delivery by{" "}
            <span className="font-medium text-brand-gold">
              {order.estimatedDeliveryAt.toLocaleDateString(undefined, { day: "numeric", month: "long" })}
            </span>
          </p>
        )}
      </div>

      {/* Items with thumbnails */}
      <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-5">
        <h2 className="font-semibold text-brand-ink">Items</h2>
        <div className="mt-4 space-y-4">
          {order.items.map((item) => {
            const image = item.product.images[0];
            return (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-brand-cream-dark">
                  {image && <Image src={image.url} alt={item.nameSnapshot} fill sizes="64px" className="object-cover" />}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="text-sm font-medium text-brand-ink hover:text-brand-gold"
                  >
                    {item.nameSnapshot}
                  </Link>
                  <p className="text-xs text-brand-ink-soft">
                    Size {item.sizeSnapshot} · {item.colorSnapshot} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand-ink">
                  {formatPrice(Number(item.unitPrice) * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-1 border-t border-brand-cream-dark pt-3 text-sm">
          <div className="flex justify-between text-brand-ink-soft">
            <span>Subtotal</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-brand-ink-soft">
            <span>Shipping</span>
            <span>{formatPrice(Number(order.shippingCharge))}</span>
          </div>
          <div className="flex justify-between font-display text-base text-brand-ink">
            <span>Total Paid</span>
            <span>{formatPrice(Number(order.grandTotal))}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-5">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
          <div>
            <h2 className="font-semibold text-brand-ink">Delivery Address</h2>
            <p className="mt-1 text-sm text-brand-ink-soft">
              {order.address.fullName}
              <br />
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}
              <br />
              {order.address.city}, {order.address.state} {order.address.postalCode}
              <br />
              {order.address.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Payment summary */}
      {order.payments.length > 0 && (
        <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-5">
          <h2 className="font-semibold text-brand-ink">Payment</h2>
          <div className="mt-2 space-y-1 text-sm text-brand-ink-soft">
            {order.payments.map((p) => (
              <div key={p.id} className="flex justify-between">
                <span className="capitalize">{p.provider} · {p.status.toLowerCase()}</span>
                <span>{formatPrice(Number(p.amount))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
