import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getProductBySlug } from "@/lib/data/products";
import { ProductGallery } from "@/components/shop/product-gallery";
import { AddToCartForm } from "@/components/shop/add-to-cart-form";
import { formatPrice, discountedPrice } from "@/lib/format";

// Price, stock and discount can change at any time via the admin dashboard —
// never serve a stale build-time snapshot of a product page.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const finalPrice = discountedPrice(Number(product.basePrice), product.discountPct);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-gold">{product.brand.name}</p>
          <h1 className="mt-1 font-display text-3xl text-brand-ink">{product.name}</h1>

          <div className="mt-2 flex items-center gap-1 text-sm text-brand-ink-soft">
            <Star className="h-4 w-4 fill-brand-gold text-brand-gold" />
            <span>{Number(product.avgRating).toFixed(1)}</span>
            <span className="text-brand-ink-soft/60">({product.ratingCount} reviews)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl text-brand-ink">{formatPrice(finalPrice)}</span>
            {product.discountPct > 0 && (
              <>
                <span className="text-lg text-brand-ink-soft/60 line-through">
                  {formatPrice(Number(product.basePrice))}
                </span>
                <span className="rounded-full bg-brand-ink px-2.5 py-1 text-xs font-semibold text-brand-gold-soft">
                  -{product.discountPct}%
                </span>
              </>
            )}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-brand-ink-soft">{product.description}</p>

          <div className="mt-8">
            <AddToCartForm productId={product.id} productSlug={product.slug} variants={product.variants} />
          </div>

          {product.reviews.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-xl text-brand-ink">Customer Reviews</h2>
              <ul className="mt-4 space-y-4">
                {product.reviews.map((review) => (
                  <li key={review.id} className="border-t border-brand-cream-dark pt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-brand-ink">{review.authorName}</span>
                      <span className="flex items-center gap-0.5 text-brand-gold">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-brand-gold" />
                        ))}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-1 text-sm text-brand-ink-soft">{review.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
