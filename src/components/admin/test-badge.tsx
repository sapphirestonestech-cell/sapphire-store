import type { PaymentMode } from "@/lib/payments/keys";

/** Marks an order or payment that was taken in test mode. */
export function TestBadge({
  mode,
  className = "",
}: {
  mode?: PaymentMode | null;
  className?: string;
}) {
  if (mode !== "test") return null;
  return (
    <span
      className={`inline-flex items-center rounded-pill border border-warning/40 bg-warning/10 px-2 py-0.5 text-label font-medium text-warning ${className}`}
    >
      Test
    </span>
  );
}
