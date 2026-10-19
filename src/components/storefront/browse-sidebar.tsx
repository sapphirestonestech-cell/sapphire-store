import Link from "next/link";
import { BudgetFilter } from "./budget-filter";

export const AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "pre_order", label: "Pre-order" },
] as const;

export interface BrowseFilters {
  availability?: string;
  category?: string;
  min?: string;
  max?: string;
}

/**
 * Homepage browse link. Sets (or clears, with null) one dimension while
 * keeping the others; the budget bounds always ride along.
 */
export function browseHref(
  current: BrowseFilters,
  next: { availability?: string | null; category?: string | null },
): string {
  const availability =
    "availability" in next
      ? (next.availability ?? undefined)
      : current.availability;
  const category =
    "category" in next ? (next.category ?? undefined) : current.category;
  const sp = new URLSearchParams();
  if (availability) sp.set("availability", availability);
  if (category) sp.set("category", category);
  if (current.min) sp.set("min", current.min);
  if (current.max) sp.set("max", current.max);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

const itemClass = (active: boolean) =>
  `flex min-h-12 items-center rounded-image px-4 text-body transition-colors duration-fast ${
    active
      ? "bg-gold-wash font-medium text-warm-ink"
      : "text-soft-taupe hover:bg-ivory-canvas hover:text-warm-ink"
  }`;

function isActiveFilter(
  filters: BrowseFilters,
  dimension: "availability" | "category",
): boolean {
  if (dimension === "availability") return Boolean(filters.availability);
  return Boolean(filters.category);
}

/** Desktop browse sidebar — grouped, sticky beside the grid (DESIGN §7.2 pattern). */
export function BrowseSidebar({
  categories,
  active,
  priceBounds,
}: {
  categories: { slug: string; name: string }[];
  active: BrowseFilters;
  priceBounds: { min: number; max: number } | null;
}) {
  const allActive =
    !isActiveFilter(active, "availability") && !isActiveFilter(active, "category");

  return (
    <nav
      aria-label="Browse rings"
      className="self-start rounded-card bg-pure-white/95 backdrop-blur-sm p-2 shadow-card lg:sticky lg:top-28"
    >
      <Link
        href="/"
        aria-current={allActive ? "page" : undefined}
        className={itemClass(allActive)}
      >
        All rings
      </Link>

      <p
        id="browse-availability-label"
        className="px-4 pb-1 pt-4 text-label font-medium text-soft-taupe"
      >
        Availability
      </p>
      <div
        role="group"
        aria-labelledby="browse-availability-label"
        className="mt-1 space-y-0.5"
      >
        {AVAILABILITY_OPTIONS.map((option) => {
          const isActive = active.availability === option.value;
          return (
            <Link
              key={option.value}
              href={browseHref(active, {
                availability: isActive ? null : option.value,
              })}
              aria-current={isActive ? "page" : undefined}
              className={itemClass(isActive)}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {categories.length > 0 ? (
        <>
          <p
            id="browse-categories-label"
            className="px-4 pb-1 pt-4 text-label font-medium text-soft-taupe"
          >
            Categories
          </p>
          <div
            role="group"
            aria-labelledby="browse-categories-label"
            className="mt-1 space-y-0.5"
          >
            {categories.map((cat) => {
              const isActive = active.category === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  href={browseHref(active, {
                    category: isActive ? null : cat.slug,
                  })}
                  aria-current={isActive ? "page" : undefined}
                  className={itemClass(isActive)}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </>
      ) : null}

      {priceBounds ? (
        <div className="px-4 pb-4 pt-5">
          <BudgetFilter
            minBound={priceBounds.min}
            maxBound={priceBounds.max}
            valueMin={active.min ? Number(active.min) : undefined}
            valueMax={active.max ? Number(active.max) : undefined}
            availability={active.availability}
            category={active.category}
          />
        </div>
      ) : null}
    </nav>
  );
}

/** Mobile quick-filters: a horizontally scrollable chip row above the grid. */
export function BrowseChips({
  categories,
  active,
}: {
  categories: { slug: string; name: string }[];
  active: BrowseFilters;
}) {
  const allActive =
    !isActiveFilter(active, "availability") && !isActiveFilter(active, "category");

  const chipClass = (isActive: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center rounded-pill border border-hairline px-4 text-body transition-colors duration-fast ${
      isActive
        ? "bg-gold-wash font-medium text-warm-ink"
        : "bg-pure-white text-warm-ink hover:bg-gold-wash"
    }`;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <Link
        href="/"
        aria-current={allActive ? "page" : undefined}
        className={chipClass(allActive)}
      >
        All rings
      </Link>
      {AVAILABILITY_OPTIONS.map((option) => {
        const isActive = active.availability === option.value;
        return (
          <Link
            key={option.value}
            href={browseHref(active, {
              availability: isActive ? null : option.value,
            })}
            aria-current={isActive ? "page" : undefined}
            className={chipClass(isActive)}
          >
            {option.label}
          </Link>
        );
      })}
      {categories.map((cat) => {
        const isActive = active.category === cat.slug;
        return (
          <Link
            key={cat.slug}
            href={browseHref(active, {
              category: isActive ? null : cat.slug,
            })}
            aria-current={isActive ? "page" : undefined}
            className={chipClass(isActive)}
          >
            {cat.name}
          </Link>
        );
      })}
    </div>
  );
}
