"use client";

import { useState, useTransition } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/lib/actions/checkout";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function CheckoutButton({ addressId, disabled }: { addressId: string | null; disabled?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  function handlePlaceOrder() {
    if (!addressId) {
      setError("Please select or add a shipping address.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const idempotencyKey = crypto.randomUUID();
      const result = await createOrderAction({ addressId, idempotencyKey });

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (!result?.razorpayOrderId || !result?.orderId) {
        setError("Could not start payment. Please try again.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round((result.amount ?? 0) * 100),
        currency: "INR",
        name: "Brandora House Studio",
        order_id: result.razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: result.orderId, ...response }),
          });

          if (verifyResponse.ok) {
            router.push(`/account/orders/${result.orderId}?success=1`);
          } else {
            router.push(`/account/orders/${result.orderId}?verification_failed=1`);
          }
        },
        modal: {
          ondismiss: () => {
            router.push(`/account/orders/${result.orderId}?cancelled=1`);
          },
        },
        theme: { color: "#14110f" },
      });

      razorpay.open();
    });
  }

  return (
    <div>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />
      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={disabled || isPending || !scriptReady}
        className="w-full rounded-md bg-brand-ink py-3 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Processing..." : "Place Order & Pay"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-brand-danger">
          {error}
        </p>
      )}
    </div>
  );
}
