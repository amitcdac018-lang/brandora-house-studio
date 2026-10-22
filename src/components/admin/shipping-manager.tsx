"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createShippingRuleAction, toggleShippingRuleAction, deleteShippingRuleAction } from "@/lib/actions/admin/shipping";
import { formatPrice } from "@/lib/format";

type Rule = {
  id: string;
  name: string;
  minOrderValue: number;
  maxOrderValue: number | null;
  charge: number;
  estimatedDays: number;
  isActive: boolean;
};

export function ShippingManager({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [form, setForm] = useState({ name: "", minOrderValue: "0", maxOrderValue: "", charge: "0", estimatedDays: "5" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleCreate(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createShippingRuleAction({
        name: form.name,
        minOrderValue: Number(form.minOrderValue),
        maxOrderValue: form.maxOrderValue ? Number(form.maxOrderValue) : null,
        charge: Number(form.charge),
        estimatedDays: Number(form.estimatedDays),
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  }

  function handleToggle(id: string, nextActive: boolean) {
    setBusyId(id);
    startTransition(async () => {
      await toggleShippingRuleAction(id, nextActive);
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: nextActive } : r)));
      setBusyId(null);
    });
  }

  function handleDelete(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await deleteShippingRuleAction(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      setBusyId(null);
    });
  }

  return (
    <div className="rounded-xl border border-brand-cream-dark bg-white p-5">
      <h2 className="font-semibold text-brand-ink">Shipping Rules</h2>

      <div className="mt-4 space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between rounded-md border border-brand-cream-dark p-3 text-sm">
            <div>
              <p className="font-medium text-brand-ink">{rule.name}</p>
              <p className="text-brand-ink-soft">
                {formatPrice(rule.minOrderValue)}
                {rule.maxOrderValue ? ` – ${formatPrice(rule.maxOrderValue)}` : "+"} → {formatPrice(rule.charge)} ·{" "}
                {rule.estimatedDays} days
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggle(rule.id, !rule.isActive)}
                disabled={busyId === rule.id}
                className={`rounded-full px-2 py-0.5 text-xs disabled:opacity-50 ${
                  rule.isActive ? "bg-brand-success/10 text-brand-success" : "bg-brand-danger/10 text-brand-danger"
                }`}
              >
                {busyId === rule.id ? "..." : rule.isActive ? "Active" : "Inactive"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(rule.id)}
                disabled={busyId === rule.id}
                aria-label={`Delete shipping rule ${rule.name}`}
                className="text-brand-danger disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate}>
        <div className="mt-4 grid grid-cols-5 gap-2">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-md border border-brand-cream-dark px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Min ₹"
            type="number"
            value={form.minOrderValue}
            onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
            className="rounded-md border border-brand-cream-dark px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Max ₹ (optional)"
            type="number"
            value={form.maxOrderValue}
            onChange={(e) => setForm((f) => ({ ...f, maxOrderValue: e.target.value }))}
            className="rounded-md border border-brand-cream-dark px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Charge ₹"
            type="number"
            value={form.charge}
            onChange={(e) => setForm((f) => ({ ...f, charge: e.target.value }))}
            className="rounded-md border border-brand-cream-dark px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Days"
            type="number"
            value={form.estimatedDays}
            onChange={(e) => setForm((f) => ({ ...f, estimatedDays: e.target.value }))}
            className="rounded-md border border-brand-cream-dark px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !form.name}
          className="mt-3 rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
        >
          Add Rule
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-brand-danger">{error}</p>}
    </div>
  );
}
