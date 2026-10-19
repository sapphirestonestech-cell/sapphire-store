"use client";

import { usePathname, useRouter } from "next/navigation";
import { PriceRange } from "./price-range";

/**
 * Budget slider wired to the homepage URL. Commits min/max as `min`/`max`
 * search params (base currency), preserving the other browse filters.
 */
export function BudgetFilter({
  minBound,
  maxBound,
  valueMin,
  valueMax,
  availability,
  category,
}: {
  minBound: number;
  maxBound: number;
  valueMin?: number;
  valueMax?: number;
  availability?: string;
  category?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function commit(min: number | undefined, max: number | undefined) {
    const sp = new URLSearchParams();
    if (availability) sp.set("availability", availability);
    if (category) sp.set("category", category);
    if (min !== undefined) sp.set("min", String(min));
    if (max !== undefined) sp.set("max", String(max));
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <PriceRange
      minBound={minBound}
      maxBound={maxBound}
      valueMin={valueMin}
      valueMax={valueMax}
      onChange={commit}
    />
  );
}
