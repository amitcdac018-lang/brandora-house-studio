import Link from "next/link";

type FilterOption = { slug: string; name: string };

export function ShopFilters({
  brands,
  categories,
  sizes,
  colors,
  searchParams,
}: {
  brands: FilterOption[];
  categories: FilterOption[];
  sizes: string[];
  colors: string[];
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const selected = (key: string): string[] => {
    const value = searchParams[key];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const selectedBrands = selected("brand");
  const selectedCategories = selected("category");
  const selectedSizes = selected("size");
  const selectedColors = selected("color");

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    Boolean(searchParams.minPrice) ||
    Boolean(searchParams.maxPrice);

  const clearFiltersHref = searchParams.q ? `/shop?q=${encodeURIComponent(String(searchParams.q))}` : "/shop";

  return (
    <form method="get" className="space-y-6 text-sm">
      {searchParams.q && (
        <input type="hidden" name="q" value={String(searchParams.q)} />
      )}

      {hasActiveFilters && (
        <Link href={clearFiltersHref} className="inline-block text-xs font-medium text-brand-gold hover:underline">
          Clear all filters
        </Link>
      )}

      <FilterGroup title="Brand">
        {brands.map((b) => (
          <CheckboxOption
            key={b.slug}
            name="brand"
            value={b.slug}
            label={b.name}
            defaultChecked={selectedBrands.includes(b.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Category">
        {categories.map((c) => (
          <CheckboxOption
            key={c.slug}
            name="category"
            value={c.slug}
            label={c.name}
            defaultChecked={selectedCategories.includes(c.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <label key={size} className="cursor-pointer">
              <input
                type="checkbox"
                name="size"
                value={size}
                defaultChecked={selectedSizes.includes(size)}
                className="peer sr-only"
              />
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-brand-cream-dark px-2 text-xs text-brand-ink-soft peer-checked:border-brand-ink peer-checked:bg-brand-ink peer-checked:text-brand-gold-soft">
                {size}
              </span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Color">
        {colors.map((color) => (
          <CheckboxOption
            key={color}
            name="color"
            value={color}
            label={color}
            defaultChecked={selectedColors.includes(color)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Price (₹)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="minPrice"
            placeholder="Min"
            min={0}
            defaultValue={searchParams.minPrice as string}
            className="w-full rounded-md border border-brand-cream-dark px-2 py-1.5 text-sm"
          />
          <span className="text-brand-ink-soft">–</span>
          <input
            type="number"
            name="maxPrice"
            placeholder="Max"
            min={0}
            defaultValue={searchParams.maxPrice as string}
            className="w-full rounded-md border border-brand-cream-dark px-2 py-1.5 text-sm"
          />
        </div>
      </FilterGroup>

      <button
        type="submit"
        className="w-full rounded-md bg-brand-ink py-2.5 text-sm font-semibold text-brand-gold-soft transition-colors hover:bg-brand-ink-soft"
      >
        Apply Filters
      </button>
    </form>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold text-brand-ink">{title}</legend>
      <div className="space-y-1.5">{children}</div>
    </fieldset>
  );
}

function CheckboxOption({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-brand-ink-soft">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-brand-cream-dark text-brand-ink focus:ring-brand-gold"
      />
      {label}
    </label>
  );
}
