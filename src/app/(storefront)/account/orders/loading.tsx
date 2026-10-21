export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-brand-cream-dark" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-brand-cream-dark bg-white p-4 sm:p-5">
            <div className="h-3 w-1/3 rounded bg-brand-cream-dark" />
            <div className="mt-3 flex items-center gap-4">
              <div className="h-16 w-16 rounded-md bg-brand-cream-dark" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-brand-cream-dark" />
                <div className="h-3 w-1/4 rounded bg-brand-cream-dark" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
