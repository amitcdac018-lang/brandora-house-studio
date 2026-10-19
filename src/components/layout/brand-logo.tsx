import Link from "next/link";

/**
 * Placeholder wordmark logo until real Instagram brand assets are supplied.
 * Swap this for an <Image> of the authorized logo file once available.
 */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 font-display text-xl tracking-wide text-brand-ink ${className}`}
      aria-label="Brandora House Studio home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink text-brand-gold-soft font-display text-base">
        B
      </span>
      <span className="hidden sm:inline">
        Brandora <span className="text-brand-gold">House</span> Studio
      </span>
    </Link>
  );
}
