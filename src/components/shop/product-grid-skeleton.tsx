export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-brand-cream-dark bg-white">
          <div className="aspect-square bg-brand-cream-dark" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-brand-cream-dark" />
            <div className="h-4 w-3/4 rounded bg-brand-cream-dark" />
            <div className="h-4 w-1/2 rounded bg-brand-cream-dark" />
          </div>
        </div>
      ))}
    </div>
  );
}
