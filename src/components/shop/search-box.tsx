import { Search } from "lucide-react";

export function SearchBox({ defaultValue }: { defaultValue?: string }) {
  return (
    <form method="get" role="search" className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-soft" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search shoes..."
        aria-label="Search products"
        className="w-full rounded-md border border-brand-cream-dark bg-white py-2 pl-9 pr-3 text-sm text-brand-ink placeholder:text-brand-ink-soft/60"
      />
    </form>
  );
}
