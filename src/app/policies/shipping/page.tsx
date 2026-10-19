import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policies/policy-layout";

export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout title="Shipping Policy" updatedAt="Draft — pending operational review">
      <p>
        This draft policy describes how orders are shipped. Confirm actual carrier partners,
        service-level agreements, and delivery timelines before launch.
      </p>

      <h2>Processing Time</h2>
      <p>Orders are typically processed within 1–2 business days of payment confirmation.</p>

      <h2>Shipping Charges</h2>
      <p>
        Shipping charges are calculated at checkout based on configurable rules (order value,
        destination) and shown before payment.
      </p>

      <h2>Estimated Delivery</h2>
      <p>
        Estimated delivery dates are shown on your order confirmation and order history page.
        Actual delivery times may vary by location and carrier.
      </p>

      <h2>Order Tracking</h2>
      <p>
        Once your order ships, tracking information will be available on your order detail page.
      </p>
    </PolicyLayout>
  );
}
