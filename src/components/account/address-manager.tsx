"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAddressAction } from "@/lib/actions/address";
import { AddressForm } from "@/components/checkout/address-form";

type AddressItem = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

export function AddressManager({ initialAddresses }: { initialAddresses: AddressItem[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAddressAction(id);
      if (result?.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {addresses.map((address) => (
          <div key={address.id} className="flex items-start justify-between rounded-lg border border-brand-cream-dark p-4">
            <div>
              <p className="font-medium text-brand-ink">
                {address.fullName} {address.isDefault && <span className="text-xs text-brand-gold">(Default)</span>}
              </p>
              <p className="text-sm text-brand-ink-soft">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}
              </p>
              <p className="text-sm text-brand-ink-soft">{address.phone}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(address.id)}
              disabled={isPending}
              aria-label={`Delete address for ${address.fullName}`}
              className="text-brand-danger hover:underline"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowForm((prev) => !prev)}
        className="mt-4 text-sm font-medium text-brand-gold hover:underline"
      >
        {showForm ? "Cancel" : "+ Add a new address"}
      </button>

      {showForm && (
        <div className="mt-4 rounded-lg border border-brand-cream-dark p-4">
          <AddressForm onCreated={() => window.location.reload()} />
        </div>
      )}
    </div>
  );
}
