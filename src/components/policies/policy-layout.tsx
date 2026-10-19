export function PolicyLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-brand-ink">{title}</h1>
      <p className="mt-1 text-sm text-brand-ink-soft">Last updated: {updatedAt}</p>
      <div className="prose prose-sm mt-8 max-w-none text-brand-ink-soft [&_h2]:font-display [&_h2]:text-brand-ink [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:mb-4">
        {children}
      </div>
    </div>
  );
}
