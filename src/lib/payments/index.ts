import { Currency, priceIn } from '@/lib/currency'
import { toMinor, fromMinor } from '@/lib/checkout'

export const MINOR_PER_UNIT = 100

export type Gateway = 'paystack' | 'bachs'

export * from './gateways'

export interface ChargeAmount {
  /** Charge in the order's display currency, minor units. */
  minor: number
  currency: Currency
}

/**
 * The amount to charge for an order: what's due now (deposit % + delivery for
 * pre-orders, the full total otherwise), converted from base minor units into
 * the order's display currency at the frozen order exchange rate and rounded
 * by the admin's rules — i.e. exactly the "Due now" figure the customer saw.
 * Gateways charge this; webhooks and poll-verify compare against it.
 */
export function chargeAmountForOrder(order: {
  amountDueNowMinor?: number | null
  totalMinor?: number
  baseCurrency: Currency
  currency: Currency
  exchangeRate: number
}): ChargeAmount {
  const baseMinor = order.amountDueNowMinor ?? order.totalMinor ?? 0
  const major = priceIn(
    fromMinor(baseMinor),
    order.baseCurrency,
    order.currency,
    order.exchangeRate,
  )
  return { minor: toMinor(major), currency: order.currency }
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
  amountDueNowMinor?: number | null
  totalMinor?: number
  baseCurrency: Currency
  currency: Currency
  exchangeRate: number
}

/**
 * Did the gateway collect exactly what we asked for? Compares against
 * `paymentAmountMinor` — the amount actually sent at initialize — falling
 * back to a recompute for rows written before that field existed. Never
 * fulfils on a mismatch (ProductReq.md §10.3, DECISIONS 2026-10-18).
 */
export function chargeMatches(
  order: ChargeComparableOrder,
  paidMinor: number,
  paidCurrency: unknown,
): boolean {
  const expected = order.paymentAmountMinor ?? chargeAmountForOrder(order).minor
  return paidMinor === expected && paidCurrency === order.currency
}
