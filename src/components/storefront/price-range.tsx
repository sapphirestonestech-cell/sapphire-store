"use client";

import { useEffect, useRef, useState } from "react";
import { useCurrency } from "@/components/currency-provider";
import { formatPrice, priceIn } from "@/lib/currency";

export interface PriceRangeProps {
  /** Catalog bounds in base currency (server-derived). */
  minBound: number;
  maxBound: number;
  /** Current filter values in base currency (URL params). */
  valueMin?: number;
  valueMax?: number;
  /** Commit (debounced) — undefined means "clear this end". */
  onChange: (min: number | undefined, max: number | undefined) => void;
}

/** Slider increments, in base currency, tuned to the catalog span. */
function niceStep(span: number): number {
  if (span <= 20) return 1;
  if (span <= 100) return 5;
  if (span <= 500) return 10;
  if (span <= 2000) return 50;
  if (span <= 10000) return 100;
  return 500;
}

/**
 * Budget range bar — dual-thumb slider over the catalog's price span.
 * The slider works in the store's base currency; the readout and chip show
 * the visitor's chosen currency. Filters ride the URL like every other
 * filter (ProductReq §5.2).
 */
export function PriceRange({
  minBound,
  maxBound,
  valueMin,
  valueMax,
  onChange,
}: PriceRangeProps) {
  const { currency, usdToNgn, baseCurrency } = useCurrency();
  const span = Math.max(1, maxBound - minBound);
  const step = niceStep(span);

  const [lo, setLo] = useState(valueMin ?? minBound);
  const [hi, setHi] = useState(valueMax ?? maxBound);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync when the URL changes from outside (chip cleared, preset link,
  // back/forward) — adjust state during render rather than in an effect.
  const [prevProps, setPrevProps] = useState({
    valueMin,
    valueMax,
    minBound,
    maxBound,
  });
  if (
    prevProps.valueMin !== valueMin ||
    prevProps.valueMax !== valueMax ||
    prevProps.minBound !== minBound ||
    prevProps.maxBound !== maxBound
  ) {
    setPrevProps({ valueMin, valueMax, minBound, maxBound });
    setLo(valueMin ?? minBound);
    setHi(valueMax ?? maxBound);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function commit(nextLo: number, nextHi: number) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const fullRange = nextLo <= minBound && nextHi >= maxBound;
      onChange(
        fullRange ? undefined : nextLo,
        fullRange ? undefined : nextHi,
      );
    }, 350);
  }

  function update(which: "lo" | "hi", raw: number) {
    let nextLo = lo;
    let nextHi = hi;
    if (which === "lo") {
      nextLo = Math.min(Math.max(raw, minBound), hi);
      setLo(nextLo);
    } else {
      nextHi = Math.max(Math.min(raw, maxBound), lo);
      setHi(nextHi);
    }
    commit(nextLo, nextHi);
  }

  const fmt = (baseValue: number) =>
    formatPrice(
      priceIn(baseValue, baseCurrency, currency, usdToNgn),
      currency,
    );

  const loPct = ((lo - minBound) / span) * 100;
  const hiPct = ((hi - minBound) / span) * 100;

  const thumbClass =
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:focus-visible:outline-none [&::-webkit-slider-thumb]:focus-visible:ring-2 [&::-webkit-slider-thumb]:focus-visible:ring-accent-strong [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:transition-shadow [&::-moz-range-thumb]:focus-visible:outline-none [&::-moz-range-thumb]:focus-visible:ring-2 [&::-moz-range-thumb]:focus-visible:ring-accent-strong";

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-label font-medium text-muted">Budget</span>
        <span className="text-body font-medium text-primary tabular">
          {fmt(lo)} – {fmt(hi)}
        </span>
      </div>

      <div className="relative flex h-6 items-center">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 h-1 rounded-pill bg-border-default"
        />
        <div
          aria-hidden="true"
          className="absolute h-1 rounded-pill bg-accent"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={step}
          value={lo}
          onChange={(e) => update("lo", Number(e.target.value))}
          aria-label="Minimum budget"
          aria-valuetext={fmt(lo)}
          className={`pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent ${thumbClass}`}
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          step={step}
          value={hi}
          onChange={(e) => update("hi", Number(e.target.value))}
          aria-label="Maximum budget"
          aria-valuetext={fmt(hi)}
          className={`pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent ${thumbClass}`}
        />
      </div>
    </div>
  );
}
