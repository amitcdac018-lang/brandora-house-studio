import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrderManager } from "@/components/admin/order-manager";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order Detail" };

export default async function AdminOrderDetailPage({ params }: PageProps<"/admin/orders/[orderId]">) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true, user: true, payments: true, shipments: true, refunds: true },
  });

  if (!order) notFound();

  const capturedPayment = order.payments.find((p) => p.status === "CAPTURED");

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Order {order.orderNumber}</h1>
      <p className="text-sm text-brand-ink-soft">{order.user.email}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-cream-dark bg-white p-5">
          <h2 className="font-semibold text-brand-ink">Items</h2>
          <div className="mt-3 space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-brand-ink-soft">
                  {item.nameSnapshot} ({item.sizeSnapshot}/{item.colorSnapshot}) × {item.quantity}
                </span>
                <span className="text-brand-ink">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-brand-cream-dark pt-3 text-sm">
            <div className="flex justify-between text-brand-ink-soft">
              <span>Subtotal</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-brand-ink-soft">
              <span>Shipping</span>
              <span>{formatPrice(Number(order.shippingCharge))}</span>
            </div>
            <div className="flex justify-between font-display text-brand-ink">
              <span>Total</span>
              <span>{formatPrice(Number(order.grandTotal))}</span>
            </div>
          </div>

          <h2 className="mt-6 font-semibold text-brand-ink">Shipping Address</h2>
          <p className="mt-2 text-sm text-brand-ink-soft">
            {order.address.fullName}, {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city}, {order.address.state}{" "}
            {order.address.postalCode} · {order.address.phone}
          </p>

          <h2 className="mt-6 font-semibold text-brand-ink">Payments</h2>
          <div className="mt-2 space-y-1 text-sm text-brand-ink-soft">
            {order.payments.map((p) => (
              <p key={p.id}>
                {p.provider} · {p.status} · {formatPrice(Number(p.amount))}
              </p>
            ))}
          </div>

          {order.refunds.length > 0 && (
            <>
              <h2 className="mt-6 font-semibold text-brand-ink">Refunds</h2>
              <div className="mt-2 space-y-1 text-sm text-brand-ink-soft">
                {order.refunds.map((r) => (
                  <p key={r.id}>
                    {formatPrice(Number(r.amount))} · {r.status}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>

        <OrderManager
          orderId={order.id}
          currentStatus={order.status}
          capturedAmount={capturedPayment ? Number(capturedPayment.amount) : null}
        />
      </div>
    </div>
  );
}
