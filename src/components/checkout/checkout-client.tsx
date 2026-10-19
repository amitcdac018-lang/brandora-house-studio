"use client";

import { useState } from "react";
import { AddressForm } from "./address-form";
import { CheckoutButton } from "./checkout-button";
import { formatPrice } from "@/lib/format";

type AddressOption = {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

export function CheckoutClient({
  addresses,
  subtotal,
}: {
  addresses: AddressOption[];
  subtotal: number;
}) {
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(defaultAddress?.id ?? null);
  const [showAddForm, setShowAddForm] = useState(addresses.length === 0);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="font-display text-xl text-brand-ink">Shipping Address</h2>

        <div className="mt-4 space-y-3">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={`block cursor-pointer rounded-lg border p-4 ${
                selectedAddressId === address.id ? "border-brand-ink bg-brand-cream" : "border-brand-cream-dark"
              }`}
            >
              <input
                type="radio"
                name="address"
                value={address.id}
                checked={selectedAddressId === address.id}
                onChange={() => setSelectedAddressId(address.id)}
                className="sr-only"
              />
              <p className="font-medium text-brand-ink">{address.fullName}</p>
              <p className="text-sm text-brand-ink-soft">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}{" "}
                {address.postalCode}
              </p>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="mt-4 text-sm font-medium text-brand-gold hover:underline"
        >
          {showAddForm ? "Cancel" : "+ Add a new address"}
        </button>

        {showAddForm && (
          <div className="mt-4 rounded-lg border border-brand-cream-dark p-4">
            <AddressForm
              onCreated={(addressId) => {
                setSelectedAddressId(addressId);
                setShowAddForm(false);
              }}
            />
          </div>
        )}
      </div>

      <div className="h-fit rounded-xl border border-brand-cream-dark bg-white p-6">
        <h2 className="font-display text-lg text-brand-ink">Order Summary</h2>
        <div className="mt-4 flex justify-between text-sm text-brand-ink-soft">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-brand-ink-soft/70">
          Final shipping charge and total are calculated securely at payment.
        </p>
        <div className="mt-6">
          <CheckoutButton addressId={selectedAddressId} disabled={addresses.length === 0 && !selectedAddressId} />
        </div>
      </div>
    </div>
  );
}
