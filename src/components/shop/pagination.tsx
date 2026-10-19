import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  };

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`rounded-md border border-brand-cream-dark px-3 py-1.5 text-sm ${
          page === 1 ? "pointer-events-none opacity-40" : "hover:border-brand-gold"
        }`}
      >
        Previous
      </Link>
      <span className="text-sm text-brand-ink-soft">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`rounded-md border border-brand-cream-dark px-3 py-1.5 text-sm ${
          page === totalPages ? "pointer-events-none opacity-40" : "hover:border-brand-gold"
        }`}
      >
        Next
      </Link>
    </nav>
  );
}
