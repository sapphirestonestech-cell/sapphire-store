/** Loading skeleton — Pale Sand blocks at the radii of the real content (§7.23). */
export function CardSkeleton() {
  return (
    <div className="rounded-card bg-pure-white p-2 shadow-card">
      <div className="aspect-[4/5] animate-pulse rounded-image bg-pale-sand/60" />
      <div className="space-y-2 px-2 pb-2 pt-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-pale-sand/60" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-pale-sand/60" />
        <div className="h-6 w-1/2 animate-pulse rounded-pill bg-pale-sand/60" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
