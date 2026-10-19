import { HeroSection } from "@/components/home/hero-section";
import { BrandStrip } from "@/components/home/brand-strip";
import { ProductRail } from "@/components/home/product-rail";
import { PromoBanner } from "@/components/home/promo-banner";
import { getFeaturedProducts, getNewArrivals, getBestSellers } from "@/lib/data/products";

// Stock, pricing and featured flags change via the admin dashboard at any time —
// never bake a stale catalog snapshot into the build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, newArrivals, bestSellers] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivals(),
    getBestSellers(),
  ]);

  return (
    <>
      <HeroSection />
      <BrandStrip />
      <ProductRail title="Featured Shoes" products={featured} viewAllHref="/shop" />
      <ProductRail title="New Arrivals" products={newArrivals} viewAllHref="/shop?sort=newest" />
      <ProductRail title="Best Sellers" products={bestSellers} viewAllHref="/shop?sort=popularity" />
      <PromoBanner />
    </>
  );
}
