import Link from "next/link";
import { brandNames } from "@/lib/site-config";

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function BrandStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="font-display text-2xl text-brand-ink">Shop by Brand</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {brandNames.map((brand) => (
          <Link
            key={brand}
            href={`/shop?brand=${toSlug(brand)}`}
            className="flex items-center justify-center rounded-xl border border-brand-cream-dark bg-white py-8 text-lg font-medium text-brand-ink transition-colors hover:border-brand-gold hover:text-brand-gold"
          >
            {brand}
          </Link>
        ))}
      </div>
    </section>
  );
}
