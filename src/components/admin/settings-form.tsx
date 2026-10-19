"use client";

import { useState, useTransition } from "react";
import { updateSiteSettingAction } from "@/lib/actions/admin/settings";

const fields = [
  { key: "instagram_url", label: "Instagram URL" },
  { key: "support_email", label: "Support Email" },
  { key: "support_phone", label: "Support Phone" },
];

export function SettingsForm({ initialValues }: { initialValues: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  function handleSave(key: string) {
    setSaved(null);
    startTransition(async () => {
      await updateSiteSettingAction({ key, value: values[key] ?? "" });
      setSaved(key);
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-brand-cream-dark bg-white p-5">
      {fields.map((field) => (
        <div key={field.key} className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor={field.key} className="block text-sm font-medium text-brand-ink">
              {field.label}
            </label>
            <input
              id={field.key}
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSave(field.key)}
            disabled={isPending}
            className="rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
          >
            Save
          </button>
          {saved === field.key && <span className="text-sm text-brand-success">Saved</span>}
        </div>
      ))}
    </div>
  );
}
