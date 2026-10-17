"use client";

import { priceIn, formatPrice, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/currency-provider";

/**
 * Renders a base-currency amount in the visitor's active currency,
 * crossfading briefly on switch (DESIGN.md §7.3).
 */
export function Price({
  amount,
  baseCurrency,
  className = "",
}: {
  amount: number;
  baseCurrency?: Currency;
  className?: string;
}) {
  const { currency, usdToNgn, baseCurrency: storeBase, switchCount } =
    useCurrency();
  const converted = priceIn(
    amount,
    baseCurrency ?? storeBase,
    currency,
    usdToNgn,
  );
  return (
    <span
      key={switchCount}
      className={`tabular price-crossfade ${className}`}
      data-currency={currency}
    >
      {formatPrice(converted, currency)}
    </span>
  );
}
