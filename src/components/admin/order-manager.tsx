"use client";

import { useState, useTransition } from "react";
import { updateOrderStatusAction, createShipmentAction, refundOrderAction } from "@/lib/actions/admin/orders";

const statusOptions = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "PAYMENT_FAILED",
];

export function OrderManager({
  orderId,
  currentStatus,
  capturedAmount,
}: {
  orderId: string;
  currentStatus: string;
  capturedAmount: number | null;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [refundAmount, setRefundAmount] = useState(capturedAmount ?? 0);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusUpdate() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, status });
      setMessage(
        result?.error ? { type: "error", text: result.error } : { type: "success", text: "Status updated." }
      );
    });
  }

  function handleShip() {
    setMessage(null);
    startTransition(async () => {
      const result = await createShipmentAction({ orderId, carrier, trackingNumber });
      setMessage(
        result?.error ? { type: "error", text: result.error } : { type: "success", text: "Shipment created." }
      );
    });
  }

  function handleRefund() {
    setMessage(null);
    startTransition(async () => {
      const result = await refundOrderAction({ orderId, amount: refundAmount });
      setMessage(
        result?.error ? { type: "error", text: result.error } : { type: "success", text: "Refund initiated." }
      );
    });
  }

  return (
    <div className="space-y-6 rounded-xl border border-brand-cream-dark bg-white p-5">
      <div>
        <p className="text-sm font-semibold text-brand-ink">Order Status</p>
        <div className="mt-2 flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleStatusUpdate}
            disabled={isPending}
            className="rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
          >
            Update
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-brand-ink">Create Shipment</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Carrier"
            className="rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          />
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            className="rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleShip}
            disabled={isPending || !carrier || !trackingNumber}
            className="rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
          >
            Mark Shipped
          </button>
        </div>
      </div>

      {capturedAmount !== null && (
        <div>
          <p className="text-sm font-semibold text-brand-ink">Issue Refund</p>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              max={capturedAmount}
              className="w-32 rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleRefund}
              disabled={isPending}
              className="rounded-md bg-brand-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Refund
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.type === "error" ? "text-brand-danger" : "text-brand-success"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
