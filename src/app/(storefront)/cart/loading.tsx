export default function CartLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-brand-cream-dark" />
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex animate-pulse gap-4 border-b border-brand-cream-dark py-4">
              <div className="h-24 w-24 rounded-md bg-brand-cream-dark" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-brand-cream-dark" />
                <div className="h-3 w-1/3 rounded bg-brand-cream-dark" />
                <div className="h-4 w-20 rounded bg-brand-cream-dark" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-brand-cream-dark" />
      </div>
    </div>
  );
}
