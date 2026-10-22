"use client";

import { useState, useTransition } from "react";

type Item = { id: string; name: string; slug: string; isActive: boolean };

export function TaxonomyManager({
  title,
  items,
  onCreate,
  onToggle,
}: {
  title: string;
  items: Item[];
  onCreate: (input: { name: string; slug: string }) => Promise<{ error?: string } | undefined>;
  onToggle: (id: string, isActive: boolean) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function handleCreate(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onCreate({ name, slug });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setName("");
      setSlug("");
      window.location.reload();
    });
  }

  function handleToggle(id: string, nextActive: boolean) {
    setTogglingId(id);
    startTransition(async () => {
      await onToggle(id, nextActive);
      setTogglingId(null);
    });
  }

  return (
    <div className="rounded-xl border border-brand-cream-dark bg-white p-5">
      <h2 className="font-semibold text-brand-ink">{title}</h2>

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border border-brand-cream-dark p-2 text-sm">
            <span className="text-brand-ink">{item.name}</span>
            <button
              type="button"
              onClick={() => handleToggle(item.id, !item.isActive)}
              disabled={togglingId === item.id}
              className={`rounded-full px-2 py-0.5 text-xs disabled:opacity-50 ${
                item.isActive ? "bg-brand-success/10 text-brand-success" : "bg-brand-danger/10 text-brand-danger"
              }`}
            >
              {togglingId === item.id ? "Updating..." : item.isActive ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="flex-1 rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug"
          className="w-32 rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending || !name || !slug}
          className="rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-brand-danger">{error}</p>}
    </div>
  );
}
