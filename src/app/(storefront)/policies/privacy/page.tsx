import type { Metadata } from "next";
import { PolicyLayout } from "@/components/policies/policy-layout";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy" updatedAt="Draft — pending legal review">
      <p>
        This draft policy outlines how Brandora House Studio collects, uses, and protects your
        personal information. Replace this placeholder with a policy reviewed by qualified legal
        counsel before launch.
      </p>

      <h2>Information We Collect</h2>
      <p>
        Account details (name, email, phone), shipping addresses, order history, and payment
        confirmation data (we never store raw card numbers or CVV — these are handled directly by
        our payment processor, Razorpay).
      </p>

      <h2>How We Use Your Information</h2>
      <p>
        To process orders, provide customer support, prevent fraud, and improve our products and
        services. We do not sell your personal information to third parties.
      </p>

      <h2>Data Security</h2>
      <p>
        We use industry-standard safeguards including encrypted connections (HTTPS), hashed
        passwords, and restricted access to personal data.
      </p>

      <h2>Your Rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data by contacting{" "}
        {siteConfig.supportEmail}.
      </p>
    </PolicyLayout>
  );
}
