import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policies/policy-layout";

export const metadata: Metadata = { title: "Cancellation Policy" };

export default function CancellationPolicyPage() {
  return (
    <PolicyLayout title="Cancellation Policy" updatedAt="Draft — pending operational review">
      <p>
        This draft policy describes order cancellations. Confirm actual cutoff windows and refund
        timelines with your operations and payments team before launch.
      </p>

      <h2>Before Shipment</h2>
      <p>
        Orders can usually be cancelled from your order history page before they are marked as
        shipped. Once cancelled, any captured payment is refunded to the original payment method.
      </p>

      <h2>After Shipment</h2>
      <p>
        Once an order has shipped, it cannot be cancelled — please refer to our Return & Refund
        Policy instead.
      </p>
    </PolicyLayout>
  );
}
