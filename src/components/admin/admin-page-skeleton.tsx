export function AdminPageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-48 rounded bg-brand-cream-dark" />
      <div className="h-10 w-full rounded-lg bg-brand-cream-dark" />
      <div className="space-y-2 rounded-xl border border-brand-cream-dark bg-white p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 w-full rounded bg-brand-cream-dark" />
        ))}
      </div>
    </div>
  );
}
