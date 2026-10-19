import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order Details" };

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  PAYMENT_FAILED: "Payment Failed",
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
    include: { items: true, address: true, shipments: true, payments: true },
  });

  if (!order || order.userId !== session.user.id) notFound();

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
        <div className="mb-6 rounded-md bg-brand-success/10 p-4 text-sm text-brand-success">
          Payment successful! Your order is confirmed.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-ink">Order {order.orderNumber}</h1>
        <span className="rounded-full bg-brand-ink px-3 py-1 text-sm text-brand-gold-soft">
          {statusLabels[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-5">
        <h2 className="font-semibold text-brand-ink">Items</h2>
        <div className="mt-3 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-brand-ink-soft">
                {item.nameSnapshot} ({item.sizeSnapshot}/{item.colorSnapshot}) × {item.quantity}
              </span>
              <span className="text-brand-ink">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
            </div>
          ))}
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
            <span>Total</span>
            <span>{formatPrice(Number(order.grandTotal))}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-5">
        <h2 className="font-semibold text-brand-ink">Shipping Address</h2>
        <p className="mt-2 text-sm text-brand-ink-soft">
          {order.address.fullName}
          <br />
          {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""}
          <br />
          {order.address.city}, {order.address.state} {order.address.postalCode}
          <br />
          {order.address.phone}
        </p>
        {order.estimatedDeliveryAt && (
          <p className="mt-3 text-sm text-brand-gold">
            Estimated delivery: {new Date(order.estimatedDeliveryAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {order.shipments.length > 0 && (
        <div className="mt-6 rounded-xl border border-brand-cream-dark bg-white p-5">
          <h2 className="font-semibold text-brand-ink">Shipment Tracking</h2>
          {order.shipments.map((shipment) => (
            <p key={shipment.id} className="mt-2 text-sm text-brand-ink-soft">
              {shipment.carrier ?? "Carrier"} · {shipment.trackingNumber ?? "Tracking number pending"} ·{" "}
              <span className="text-brand-gold">{shipment.status}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
