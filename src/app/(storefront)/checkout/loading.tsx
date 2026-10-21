export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-brand-cream-dark" />
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-lg bg-brand-cream-dark" />
          <div className="h-24 animate-pulse rounded-lg bg-brand-cream-dark" />
        </div>
        <div className="h-56 animate-pulse rounded-xl bg-brand-cream-dark" />
      </div>
    </div>
  );
}
