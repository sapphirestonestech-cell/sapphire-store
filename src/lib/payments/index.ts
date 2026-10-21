import { Currency, priceIn } from '@/lib/currency'
import { toMinor, fromMinor } from '@/lib/checkout'

export const MINOR_PER_UNIT = 100

export type Gateway = 'paystack' | 'bachs'

export * from './gateways'

export interface ChargeAmount {
  /** Charge in the charge currency (the gateway's currency), minor units. */
  minor: number
  currency: Currency
}

/**
 * The amount to charge for an order: what's due now (deposit % + delivery for
 * pre-orders, the full total otherwise), converted from base minor units into
 * the charge currency at the frozen order exchange rate and rounded by the
 * admin's rules. When no `chargeCurrency` is given, the charge currency is the
 * order's display currency — i.e. exactly the "Due now" figure the customer
 * saw. When `alwaysPayInNaira` is on, the initialize route passes "NGN" so a
 * USD-displaying order is converted to naira at the same frozen rate before
 * the gateway sees it (ProductReq.md §7; DECISIONS 2026-10-21). Gateways
 * charge this; webhooks and poll-verify compare against it.
 */
export function chargeAmountForOrder(
  order: {
    amountDueNowMinor?: number | null
    totalMinor?: number
    baseCurrency: Currency
    currency: Currency
    exchangeRate: number
  },
  chargeCurrency?: Currency,
): ChargeAmount {
  const baseMinor = order.amountDueNowMinor ?? order.totalMinor ?? 0
  const target = chargeCurrency ?? order.currency
  const major = priceIn(
    fromMinor(baseMinor),
    order.baseCurrency,
    target,
    order.exchangeRate,
  )
  return { minor: toMinor(major), currency: target }
}

export function formatAmountForGateway(g: 'paystack', amountMinor: number): { amountSubunit: number }
export function formatAmountForGateway(g: 'bachs', amountMinor: number): { amountDecimal: string }
export function formatAmountForGateway(g: Gateway, amountMinor: number) {
  if (g === 'paystack') {
    // Paystack takes the charge amount in subunits of the charge currency.
    return { amountSubunit: Math.round(amountMinor) }
  }
  // BACHS expects a decimal string at currency precision, never minor units.
  return { amountDecimal: fromMinor(amountMinor).toFixed(2) }
}

/** The order fields a charge comparison needs (matches `chargeAmountForOrder`). */
export interface ChargeComparableOrder {
  paymentAmountMinor?: number | null
  /** The currency actually sent to the gateway, when recorded at initialize. */
  paymentCurrency?: Currency | null
  amountDueNowMinor?: number | null
  totalMinor?: number
  baseCurrency: Currency
  currency: Currency
  exchangeRate: number
}

/**
 * Did the gateway collect exactly what we asked for? Compares against
 * `paymentAmountMinor` — the amount actually sent at initialize — falling
 * back to a recompute for rows written before that field existed. The paid
 * currency must match the currency that was charged (`paymentCurrency`, which
 * is naira for converted USD orders under "Always pay in naira"). Never
 * fulfils on a mismatch (ProductReq.md §10.3, DECISIONS 2026-10-18).
 */
export function chargeMatches(
  order: ChargeComparableOrder,
  paidMinor: number,
  paidCurrency: unknown,
): boolean {
  const chargeCurrency = order.paymentCurrency ?? order.currency
  const expected =
    order.paymentAmountMinor ??
    chargeAmountForOrder(order, chargeCurrency).minor
  return paidMinor === expected && paidCurrency === chargeCurrency
}
