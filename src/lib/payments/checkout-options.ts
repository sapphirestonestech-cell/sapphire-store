import type { Currency } from '@/lib/currency'
import {
  gatewaySupportsCurrency,
  type Gateway,
  type GatewayFlags,
} from '@/lib/payments/gateways'

export interface CheckoutGateway {
  id: Gateway
}

export interface CheckoutOptions {
  /** Enabled, key-configured gateways that accept the charge currency. */
  gateways: CheckoutGateway[]
  /** True only when the shopper may choose USD or NGN. */
  allowCurrencyChoice: boolean
  /** The currency the customer will actually be charged in. */
  chargeCurrency: Currency
}

/**
 * Decide the charge currency and the gateways a customer may pick.
 *
 * USD is only offered when the store is priced in USD, the shopper is
 * viewing USD, the admin allows USD checkout, and at least one enabled,
 * configured gateway accepts USD (currently BACHS; Paystack is NGN-only
 * on this merchant account). Everything else is charged in NGN at the
 * order's frozen rate. `requestedCharge` comes from the customer's choice
 * and is ignored when USD is not allowed.
 */
export function resolveCheckoutOptions(input: {
  flags: GatewayFlags
  configured: Record<Gateway, boolean>
  baseCurrency: Currency
  displayCurrency: Currency
  requestedCharge?: Currency | null
}): CheckoutOptions {
  const { flags, configured, baseCurrency, displayCurrency, requestedCharge } =
    input
  const usable = (['paystack', 'bachs'] as const).filter(
    (gateway) => flags[gateway] && configured[gateway],
  )
  const allowCurrencyChoice =
    baseCurrency === 'USD' &&
    displayCurrency === 'USD' &&
    flags.allowUsdCheckout &&
    usable.some((gateway) => gatewaySupportsCurrency(gateway, 'USD'))
  const chargeCurrency: Currency = allowCurrencyChoice
    ? requestedCharge === 'NGN'
      ? 'NGN'
      : 'USD'
    : 'NGN'

  return {
    gateways: usable
      .filter((gateway) => gatewaySupportsCurrency(gateway, chargeCurrency))
      .map((id) => ({ id })),
    allowCurrencyChoice,
    chargeCurrency,
  }
}
