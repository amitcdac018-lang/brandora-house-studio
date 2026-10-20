"use client";

import { useState, useTransition } from "react";
import {
  updateOrderStatusAction,
  createShipmentAction,
  createShiprocketShipmentAction,
  cancelShiprocketShipmentAction,
  refundOrderAction,
} from "@/lib/actions/admin/orders";

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

type ShipmentSummary = {
  id: string;
  provider: "MANUAL" | "SHIPROCKET";
  status: string;
  trackingNumber: string | null;
};

type ActiveAction = "status" | "ship" | "shiprocket" | "cancel" | "refund" | null;

export function OrderManager({
  orderId,
  currentStatus,
  capturedAmount,
  shipments = [],
}: {
  orderId: string;
  currentStatus: string;
  capturedAmount: number | null;
  shipments?: ShipmentSummary[];
}) {
  const [status, setStatus] = useState(currentStatus);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [weightKg, setWeightKg] = useState(0.5);
  const [refundAmount, setRefundAmount] = useState(capturedAmount ?? 0);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);

  function handleStatusUpdate() {
    setMessage(null);
    setActiveAction("status");
    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, status });
      setMessage(
        result?.error ? { type: "error", text: result.error } : { type: "success", text: "Status updated." }
      );
      setActiveAction(null);
    });
  }

  function handleShip() {
    setMessage(null);
    setActiveAction("ship");
    startTransition(async () => {
      const result = await createShipmentAction({ orderId, carrier, trackingNumber });
      setMessage(
        result?.error ? { type: "error", text: result.error } : { type: "success", text: "Shipment created." }
      );
      setActiveAction(null);
    });
  }

  function handleShiprocketBook() {
    setMessage(null);
    setActiveAction("shiprocket");
    startTransition(async () => {
      const result = await createShiprocketShipmentAction({ orderId, weightKg });
      setMessage(
        result?.error
          ? { type: "error", text: result.error }
          : { type: "success", text: `Booked with ${result.courier} — AWB ${result.awb}` }
      );
      setActiveAction(null);
    });
  }

  function handleCancelShipment(shipmentId: string) {
    setMessage(null);
    setActiveAction("cancel");
    startTransition(async () => {
      const result = await cancelShiprocketShipmentAction({ shipmentId });
      setMessage(
        result?.error ? { type: "error", text: result.error } : { type: "success", text: "Shipment cancelled." }
      );
      setActiveAction(null);
    });
  }

  function handleRefund() {
    setMessage(null);
    setActiveAction("refund");
    startTransition(async () => {
      const result = await refundOrderAction({ orderId, amount: refundAmount });
      setMessage(
        result?.error ? { type: "error", text: result.error } : { type: "success", text: "Refund initiated." }
      );
      setActiveAction(null);
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
            {activeAction === "status" ? "Updating..." : "Update"}
          </button>
        </div>
      </div>

      {(() => {
        const activeShiprocketShipment = shipments.find(
          (s) => s.provider === "SHIPROCKET" && s.status !== "CANCELLED"
        );

        if (activeShiprocketShipment) {
          return (
            <div>
              <p className="text-sm font-semibold text-brand-ink">Shiprocket Shipment</p>
              <p className="mt-1 text-sm text-brand-ink-soft">
                AWB {activeShiprocketShipment.trackingNumber ?? "pending"} ·{" "}
                <span className="text-brand-gold">{activeShiprocketShipment.status}</span>
              </p>
              <button
                type="button"
                onClick={() => handleCancelShipment(activeShiprocketShipment.id)}
                disabled={isPending}
                className="mt-2 rounded-md border border-brand-danger px-4 py-2 text-sm font-semibold text-brand-danger hover:bg-brand-danger hover:text-white disabled:opacity-50"
              >
                {activeAction === "cancel" ? "Cancelling..." : "Cancel Shipment"}
              </button>
            </div>
          );
        }

        return (
          <div>
            <p className="text-sm font-semibold text-brand-ink">Book Shipment via Shiprocket</p>
            <p className="mt-1 text-xs text-brand-ink-soft">
              Books the order with Shiprocket and auto-assigns a courier to generate a real AWB
              (tracking number). Requires Shiprocket to be configured.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-brand-ink-soft">
                Weight (kg)
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-20 rounded-md border border-brand-cream-dark px-2 py-1.5 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={handleShiprocketBook}
                disabled={isPending}
                className="rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
              >
                {activeAction === "shiprocket" ? "Booking..." : "Book with Shiprocket"}
              </button>
            </div>
          </div>
        );
      })()}

      <div>
        <p className="text-sm font-semibold text-brand-ink">Or Enter Tracking Manually</p>
        <p className="mt-1 text-xs text-brand-ink-soft">
          Use this if you booked the shipment directly with a carrier outside Shiprocket.
        </p>
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
            {activeAction === "ship" ? "Saving..." : "Mark Shipped"}
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
              {activeAction === "refund" ? "Refunding..." : "Refund"}
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
