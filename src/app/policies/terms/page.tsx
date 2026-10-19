import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policies/policy-layout";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <PolicyLayout title="Terms & Conditions" updatedAt="Draft — pending legal review">
      <p>
        These draft terms govern your use of the Brandora House Studio website and the purchase of
        products through it. Replace this placeholder with terms reviewed by qualified legal
        counsel before launch.
      </p>

      <h2>Use of the Site</h2>
      <p>
        You agree to use this site only for lawful purposes and in accordance with these terms.
      </p>

      <h2>Product Listings</h2>
      <p>
        We make reasonable efforts to display accurate pricing, descriptions, and availability, but
        errors may occur. We reserve the right to correct errors and cancel affected orders.
      </p>

      <h2>Payments</h2>
      <p>
        Payments are processed securely through Razorpay. By placing an order, you authorize us to
        charge the listed amount using your chosen payment method.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        Brandora House Studio is not liable for indirect or consequential damages arising from use
        of the site, to the maximum extent permitted by law.
      </p>
    </PolicyLayout>
  );
}
