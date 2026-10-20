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
  shippingCharge,
  estimatedDays,
}: {
  addresses: AddressOption[];
  subtotal: number;
  shippingCharge: number;
  estimatedDays: number;
}) {
  const total = subtotal + shippingCharge;
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
              onCreated={() => {
                // Reload so the newly saved address actually appears in the list above —
                // this component only has the server-rendered snapshot of addresses from
                // page load, so setting selectedAddressId alone would leave the radio list
                // unchanged while still pointing checkout at an address the customer can't see.
                window.location.reload();
              }}
            />
          </div>
        )}
      </div>

      <div className="h-fit rounded-xl border border-brand-cream-dark bg-white p-6">
        <h2 className="font-display text-lg text-brand-ink">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-brand-ink-soft">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-brand-ink-soft">
            <span>Shipping</span>
            <span className={shippingCharge === 0 ? "font-medium text-brand-success" : undefined}>
              {shippingCharge === 0 ? "FREE" : formatPrice(shippingCharge)}
            </span>
          </div>
          <div className="flex justify-between border-t border-brand-cream-dark pt-2 font-display text-base text-brand-ink">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-brand-ink-soft/70">
          Estimated delivery in {estimatedDays} day{estimatedDays === 1 ? "" : "s"}. You&apos;ll pay this exact amount
          via Razorpay on the next step.
        </p>
        <div className="mt-6">
          <CheckoutButton addressId={selectedAddressId} disabled={addresses.length === 0 && !selectedAddressId} />
          {addresses.length === 0 && !selectedAddressId && (
            <p className="mt-2 text-center text-xs text-brand-ink-soft">
              Add a shipping address above to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
