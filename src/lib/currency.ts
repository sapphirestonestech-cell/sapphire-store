/**
 * Pricing and currency conversion — ProductReq.md §7.
 * Money is never computed with floating-point arithmetic for storage;
 * conversion rounds once at display time using the admin's rounding rules.
 */

export type Currency = "USD" | "NGN";

/** Default exchange rate used only until the admin sets one (seed: 1 USD = 1,600 NGN). */
export const DEFAULT_USD_TO_NGN = 1600;

export interface RoundingSettings {
  /** Decimal places for USD (default 2). */
  usdDecimals: number;
  /** Nearest whole unit for NGN (default 50). */
  ngnNearest: number;
}

export const DEFAULT_ROUNDING: RoundingSettings = {
  usdDecimals: 2,
  ngnNearest: 50,
};

/**
 * Convert an amount between currencies using the USD→NGN rate.
 * - base USD → NGN: amount × rate
 * - base NGN → USD: amount ÷ rate
 */
export function convertAmount(
  amount: number,
  usdToNgn: number,
  from: Currency,
  to: Currency,
): number {
  if (from === to) return amount;
  if (usdToNgn <= 0) {
    throw new Error("Exchange rate must be greater than zero.");
  }
  return from === "USD" ? amount * usdToNgn : amount / usdToNgn;
}

/** Apply the admin's rounding rule for a currency. */
export function roundAmount(
  amount: number,
  currency: Currency,
  rounding: RoundingSettings = DEFAULT_ROUNDING,
): number {
  if (currency === "USD") {
    const factor = 10 ** rounding.usdDecimals;
    return Math.round(amount * factor) / factor;
  }
  const nearest = rounding.ngnNearest > 0 ? rounding.ngnNearest : 1;
  return Math.round(amount / nearest) * nearest;
}

/** Convert, round, in one step. This is what display code should call. */
export function priceIn(
  baseAmount: number,
  baseCurrency: Currency,
  displayCurrency: Currency,
  usdToNgn: number,
  rounding: RoundingSettings = DEFAULT_ROUNDING,
): number {
  return roundAmount(
    convertAmount(baseAmount, usdToNgn, baseCurrency, displayCurrency),
    displayCurrency,
    rounding,
  );
}

const CURRENCY_SYMBOL: Record<Currency, string> = { USD: "$", NGN: "₦" };

/**
 * Format a price for display. Always shows the symbol, uses the correct
 * separators, never mixes currencies (§7.4). The ₦ glyph is present in
 * both chosen typefaces.
 */
export function formatPrice(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOL[currency];
  if (currency === "USD") {
    const formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${formatted}`;
  }
  const formatted = amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${symbol}${formatted}`;
}

export function currencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOL[currency];
}
