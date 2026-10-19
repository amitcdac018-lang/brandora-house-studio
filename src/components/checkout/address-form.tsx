"use client";

import { useState, useTransition } from "react";
import { addressSchema } from "@/lib/validations/checkout";
import { createAddressAction } from "@/lib/actions/address";

export function AddressForm({ onCreated }: { onCreated: (addressId: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);

    const parsed = addressSchema.safeParse({
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      line1: formData.get("line1"),
      line2: formData.get("line2") || undefined,
      city: formData.get("city"),
      state: formData.get("state"),
      postalCode: formData.get("postalCode"),
      country: "IN",
      isDefault: formData.get("isDefault") === "on",
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the address fields.");
      return;
    }

    startTransition(async () => {
      const result = await createAddressAction(parsed.data);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.addressId) onCreated(result.addressId);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name" name="fullName" required />
        <Field label="Phone" name="phone" type="tel" required />
      </div>
      <Field label="Address Line 1" name="line1" required />
      <Field label="Address Line 2 (optional)" name="line2" />
      <div className="grid grid-cols-3 gap-3">
        <Field label="City" name="city" required />
        <Field label="State" name="state" required />
        <Field label="Postal Code" name="postalCode" required />
      </div>
      <label className="flex items-center gap-2 text-sm text-brand-ink-soft">
        <input type="checkbox" name="isDefault" className="h-4 w-4" />
        Set as default address
      </label>

      {error && (
        <p role="alert" className="text-sm text-brand-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-brand-ink py-2.5 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Address"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-brand-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
      />
    </div>
  );
}
