import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-ink text-brand-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-gold">
          Discover · Style · Inspire
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
          Step Into Premium Footwear
        </h1>
        <p className="mt-4 max-w-xl text-brand-cream/80">
          Curated shoes from Campus, Nike, Aqualite, and Action Shoes — crafted for
          comfort, built for style.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/shop"
            className="rounded-md bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-gold-soft"
          >
            Shop Now
          </Link>
          <Link
            href="/shop?sort=newest"
            className="rounded-md border border-brand-cream/30 px-6 py-3 text-sm font-semibold text-brand-cream hover:border-brand-gold hover:text-brand-gold"
          >
            New Arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}
