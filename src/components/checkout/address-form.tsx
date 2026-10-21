"use client";

import { useState, useTransition } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { addressSchema } from "@/lib/validations/checkout";
import { createAddressAction } from "@/lib/actions/address";

type AddressFields = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

const emptyAddressFields: AddressFields = { line1: "", line2: "", city: "", state: "", postalCode: "" };

export function AddressForm({ onCreated }: { onCreated: (addressId: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [fields, setFields] = useState<AddressFields>(emptyAddressFields);

  function updateField<K extends keyof AddressFields>(key: K, value: AddressFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function getCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  async function resolveAddressFromPosition(position: GeolocationPosition) {
    const { latitude, longitude } = position.coords;
    const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error ?? "Could not detect your address. Please enter it manually.");
    }

    setFields((prev) => ({
      ...prev,
      line1: data.line1 || prev.line1,
      city: data.city || prev.city,
      state: data.state || prev.state,
      postalCode: data.postalCode || prev.postalCode,
    }));
    setLocationNotice("Address detected — please double-check it before saving.");
  }

  async function handleUseCurrentLocation() {
    setLocationError(null);
    setLocationNotice(null);

    if (!("geolocation" in navigator)) {
      setLocationError("Your browser doesn't support location detection. Please enter your address manually.");
      return;
    }

    setIsLocating(true);
    try {
      // GPS frequently fails or times out on the first fix (cold start, indoors, weak
      // signal) but succeeds moments later — so automatically retry once with relaxed
      // accuracy and a longer timeout before surfacing an error to the user.
      let position: GeolocationPosition;
      try {
        position = await getCurrentPosition({ enableHighAccuracy: true, timeout: 10_000 });
      } catch (firstError) {
        const geoError = firstError as GeolocationPositionError;
        if (geoError.code === geoError.PERMISSION_DENIED) throw geoError;
        position = await getCurrentPosition({ enableHighAccuracy: false, timeout: 20_000, maximumAge: 60_000 });
      }

      await resolveAddressFromPosition(position);
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      if (typeof geoError.code === "number") {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please enable it in your browser settings, or enter your address manually.");
        } else {
          setLocationError("Couldn't get a GPS fix just now — this can happen indoors or with a weak signal. Please try again.");
        }
      } else {
        setLocationError((err as Error).message || "Could not detect your address. Please enter it manually.");
      }
    } finally {
      setIsLocating(false);
    }
  }

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
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={isLocating}
        className="flex items-center gap-2 rounded-md border border-brand-gold px-3 py-2 text-sm font-medium text-brand-gold hover:bg-brand-gold-soft disabled:opacity-50"
      >
        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        {isLocating ? "Detecting your location..." : locationError ? "Try Again" : "Use Current Location"}
      </button>

      {locationError && (
        <p role="alert" className="text-xs text-brand-danger">
          {locationError}
        </p>
      )}
      {locationNotice && <p className="text-xs text-brand-success">{locationNotice}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name" name="fullName" required />
        <Field label="Phone" name="phone" type="tel" required />
      </div>
      <Field
        label="Address Line 1"
        name="line1"
        required
        value={fields.line1}
        onChange={(v) => updateField("line1", v)}
      />
      <Field
        label="Address Line 2 (optional)"
        name="line2"
        value={fields.line2}
        onChange={(v) => updateField("line2", v)}
      />
      <div className="grid grid-cols-3 gap-3">
        <Field label="City" name="city" required value={fields.city} onChange={(v) => updateField("city", v)} />
        <Field label="State" name="state" required value={fields.state} onChange={(v) => updateField("state", v)} />
        <Field
          label="Postal Code"
          name="postalCode"
          required
          value={fields.postalCode}
          onChange={(v) => updateField("postalCode", v)}
        />
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
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-brand-ink">
        {label}
      </label>
      {value !== undefined && onChange ? (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
