"use client";

import { useCurrency } from "@/components/currency-provider";
import { currencySymbol, type Currency } from "@/lib/currency";

const OPTIONS: Currency[] = ["USD", "NGN"];

/**
 * Currency switcher — DESIGN.md §7.3. Compact two-option pill; the active
 * option gets a Gold Wash fill and gold outline.
 */
export function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div
      role="group"
      aria-label="Currency"
      className={`inline-flex items-center rounded-pill border border-border-subtle bg-card p-0.5 ${className}`}
    >
      {OPTIONS.map((c) => {
        const active = c === currency;
        return (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            aria-pressed={active}
            className={[
              "inline-flex h-8 items-center gap-1 rounded-pill px-2.5 text-label font-medium transition-colors duration-fast",
              active
                ? "bg-accent-wash text-primary shadow-[inset_0_0_0_1px_var(--accent)]"
                : "text-muted hover:text-primary",
            ].join(" ")}
          >
            <span aria-hidden="true">{currencySymbol(c)}</span>
            <span>{c}</span>
            <span className="sr-only">{active ? "(selected)" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}
