"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { productCreateSchema, productUpdateSchema } from "@/lib/validations/product";
import { createProductAction, updateProductAction } from "@/lib/actions/admin/products";

type Brand = { id: string; name: string };
type Category = { id: string; name: string };

type VariantRow = { size: string; color: string; sku: string; stock: number; priceOverride?: number | null };

type ExistingProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brandId: string;
  categoryId: string;
  basePrice: number;
  discountPct: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  images: { url: string; altText: string | null }[];
  variants: VariantRow[];
};

export function ProductForm({
  brands,
  categories,
  existing,
}: {
  brands: Brand[];
  categories: Category[];
  existing?: ExistingProduct;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<{ url: string; altText: string }[]>(
    existing?.images.map((i) => ({ url: i.url, altText: i.altText ?? "" })) ?? [{ url: "", altText: "" }]
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    existing?.variants ?? [{ size: "", color: "", sku: "", stock: 0, priceOverride: null }]
  );

  function handleSubmit(formData: FormData) {
    setError(null);

    const payload = {
      ...(existing ? { id: existing.id } : {}),
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      brandId: formData.get("brandId"),
      categoryId: formData.get("categoryId"),
      basePrice: Number(formData.get("basePrice")),
      discountPct: Number(formData.get("discountPct") || 0),
      isFeatured: formData.get("isFeatured") === "on",
      isNewArrival: formData.get("isNewArrival") === "on",
      isBestSeller: formData.get("isBestSeller") === "on",
      isActive: formData.get("isActive") === "on",
      images: images.filter((i) => i.url.trim()),
      variants: variants
        .filter((v) => v.size.trim() && v.color.trim() && v.sku.trim())
        .map((v) => ({ ...v, stock: Number(v.stock) || 0 })),
    };

    const schema = existing ? productUpdateSchema : productCreateSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form fields.");
      return;
    }

    startTransition(async () => {
      const result = existing
        ? await updateProductAction(parsed.data)
        : await createProductAction(parsed.data);

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" name="name" defaultValue={existing?.name} required />
        <Field label="Slug" name="slug" defaultValue={existing?.slug} required />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-brand-ink">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={existing?.description}
          required
          rows={4}
          className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="brandId" className="block text-sm font-medium text-brand-ink">
            Brand
          </label>
          <select
            id="brandId"
            name="brandId"
            defaultValue={existing?.brandId}
            required
            className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          >
            <option value="">Select a brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-brand-ink">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={existing?.categoryId}
            required
            className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Base Price (₹)" name="basePrice" type="number" defaultValue={existing?.basePrice} required />
        <Field label="Discount %" name="discountPct" type="number" defaultValue={existing?.discountPct ?? 0} />
      </div>

      <div className="flex flex-wrap gap-4">
        <Checkbox label="Featured" name="isFeatured" defaultChecked={existing?.isFeatured} />
        <Checkbox label="New Arrival" name="isNewArrival" defaultChecked={existing?.isNewArrival} />
        <Checkbox label="Best Seller" name="isBestSeller" defaultChecked={existing?.isBestSeller} />
        <Checkbox label="Active" name="isActive" defaultChecked={existing?.isActive ?? true} />
      </div>

      <div>
        <p className="text-sm font-medium text-brand-ink">Images (URLs)</p>
        {images.map((image, index) => (
          <div key={index} className="mt-2 flex gap-2">
            <input
              value={image.url}
              onChange={(e) =>
                setImages((prev) => prev.map((img, i) => (i === index ? { ...img, url: e.target.value } : img)))
              }
              placeholder="https://..."
              className="flex-1 rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
            />
            <input
              value={image.altText}
              onChange={(e) =>
                setImages((prev) => prev.map((img, i) => (i === index ? { ...img, altText: e.target.value } : img)))
              }
              placeholder="Alt text"
              className="w-40 rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setImages((prev) => [...prev, { url: "", altText: "" }])}
          className="mt-2 text-sm text-brand-gold hover:underline"
        >
          + Add image
        </button>
      </div>

      <div>
        <p className="text-sm font-medium text-brand-ink">Variants (Size / Color / SKU / Stock)</p>
        {variants.map((variant, index) => (
          <div key={index} className="mt-2 grid grid-cols-4 gap-2">
            <input
              value={variant.size}
              onChange={(e) =>
                setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, size: e.target.value } : v)))
              }
              placeholder="Size (e.g. UK 8)"
              className="rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
            />
            <input
              value={variant.color}
              onChange={(e) =>
                setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, color: e.target.value } : v)))
              }
              placeholder="Color"
              className="rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
            />
            <input
              value={variant.sku}
              onChange={(e) =>
                setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, sku: e.target.value } : v)))
              }
              placeholder="SKU"
              className="rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={variant.stock}
              onChange={(e) =>
                setVariants((prev) =>
                  prev.map((v, i) => (i === index ? { ...v, stock: Number(e.target.value) } : v))
                )
              }
              placeholder="Stock"
              className="rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setVariants((prev) => [...prev, { size: "", color: "", sku: "", stock: 0, priceOverride: null }])
          }
          className="mt-2 text-sm text-brand-gold hover:underline"
        >
          + Add variant
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-brand-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-ink px-6 py-2.5 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft disabled:opacity-50"
      >
        {isPending ? "Saving..." : existing ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
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
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-md border border-brand-cream-dark px-3 py-2 text-sm"
      />
    </div>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-brand-ink-soft">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}
