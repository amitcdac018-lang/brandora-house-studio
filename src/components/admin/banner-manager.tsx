"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { createBannerAction, toggleBannerActiveAction, deleteBannerAction } from "@/lib/actions/admin/banners";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
};

export function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [form, setForm] = useState({ title: "", subtitle: "", imageUrl: "", linkUrl: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createBannerAction({
        title: form.title,
        subtitle: form.subtitle || undefined,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || undefined,
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
      await toggleBannerActiveAction(id, nextActive);
      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: nextActive } : b)));
      setBusyId(null);
    });
  }

  function handleDelete(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await deleteBannerAction(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setBusyId(null);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <div key={banner.id} className="overflow-hidden rounded-xl border border-brand-cream-dark bg-white">
            <div className="relative h-32 bg-brand-cream-dark">
              <Image src={banner.imageUrl} alt={banner.title} fill sizes="300px" className="object-cover" />
            </div>
            <div className="p-3">
              <p className="font-medium text-brand-ink">{banner.title}</p>
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggle(banner.id, !banner.isActive)}
                  disabled={busyId === banner.id}
                  className={`rounded-full px-2 py-0.5 text-xs disabled:opacity-50 ${
                    banner.isActive ? "bg-brand-success/10 text-brand-success" : "bg-brand-danger/10 text-brand-danger"
                  }`}
                >
                  {busyId === banner.id ? "..." : banner.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(banner.id)}
                  disabled={busyId === banner.id}
                  aria-label={`Delete banner ${banner.title}`}
                  className="text-brand-danger disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 max-w-lg rounded-xl border border-brand-cream-dark bg-white p-5">
        <h2 className="font-semibold text-brand-ink">Add Banner</h2>
        <div className="mt-3 space-y-2">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          />
          <input
            placeholder="Subtitle (optional)"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          />
          <input
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            className="w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          />
          <input
            placeholder="Link URL (optional)"
            value={form.linkUrl}
            onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
            className="w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending || !form.title || !form.imageUrl}
          className="mt-3 rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
        >
          Add Banner
        </button>
        {error && <p className="mt-2 text-sm text-brand-danger">{error}</p>}
      </div>
    </div>
  );
}
