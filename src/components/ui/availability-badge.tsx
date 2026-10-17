import { formatArrivalShort } from "@/lib/format";

/**
 * Availability badges — DESIGN.md §7.7. One glance, no second accent
 * colour, and the pre-order badge always carries its arrival date.
 */
export function AvailabilityBadge({
  availability,
  arrivalDate,
  soldOut = false,
}: {
  availability: "in_stock" | "pre_order";
  arrivalDate?: string | Date | null;
  soldOut?: boolean;
}) {
  if (soldOut) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-pale-sand px-3 py-1.5 text-label font-medium text-soft-taupe">
        Sold out
      </span>
    );
  }
  if (availability === "pre_order") {
    const short = arrivalDate ? formatArrivalShort(arrivalDate) : null;
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-gold-wash px-3 py-1.5 text-label font-medium text-deep-gold">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
          <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
        </svg>
        {short ? `Pre-order · arrives ${short}` : "Pre-order"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-pure-white px-3 py-1.5 text-label font-medium text-warm-ink">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-warm-ink" />
      In stock
    </span>
  );
}
