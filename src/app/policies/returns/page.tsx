import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policies/policy-layout";

export const metadata: Metadata = { title: "Return & Refund Policy" };

export default function ReturnsPolicyPage() {
  return (
    <PolicyLayout title="Return & Refund Policy" updatedAt="Draft — pending operational review">
      <p>
        This draft policy describes returns and refunds. Confirm actual return windows, condition
        requirements, and refund processing times before launch.
      </p>

      <h2>Return Window</h2>
      <p>
        Items may typically be returned within a set number of days of delivery, unused and in
        original packaging.
      </p>

      <h2>Refunds</h2>
      <p>
        Approved refunds are processed back to the original payment method via Razorpay, typically
        within several business days of the return being received and inspected.
      </p>

      <h2>Non-Returnable Items</h2>
      <p>Clearance or final-sale items may be excluded from returns — this will be noted on the product page.</p>
    </PolicyLayout>
  );
}
