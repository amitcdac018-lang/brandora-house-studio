import Link from "next/link";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { siteConfig } from "@/lib/site-config";

export function PromoBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-brand-gold-soft px-8 py-10 text-center sm:flex-row sm:text-left">
        <div>
          <h2 className="font-display text-2xl text-brand-ink">Follow Our Journey</h2>
          <p className="mt-1 text-brand-ink-soft">
            Fashion, lifestyle, and premium brand drops — follow us on Instagram.
          </p>
        </div>
        <Link
          href={siteConfig.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md bg-brand-ink px-6 py-3 text-sm font-semibold text-brand-gold-soft hover:bg-brand-ink-soft"
        >
          <InstagramIcon className="h-4 w-4" />
          @brandora_house_studio
        </Link>
      </div>
    </section>
  );
}
