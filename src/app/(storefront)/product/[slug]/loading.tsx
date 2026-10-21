export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-xl bg-brand-cream-dark" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-brand-cream-dark" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-brand-cream-dark" />
          <div className="h-6 w-32 animate-pulse rounded bg-brand-cream-dark" />
          <div className="h-20 w-full animate-pulse rounded bg-brand-cream-dark" />
          <div className="h-12 w-full animate-pulse rounded bg-brand-cream-dark" />
        </div>
      </div>
    </div>
  );
}
