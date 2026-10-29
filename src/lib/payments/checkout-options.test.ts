import { describe, expect, it } from 'vitest'
import { resolveCheckoutOptions } from '@/lib/payments/checkout-options'
import type { GatewayFlags } from '@/lib/payments/gateways'

const flags: GatewayFlags = {
  paystack: true,
  bachs: true,
  allowUsdCheckout: false,
  paystackMode: 'live',
  bachsMode: 'live',
}
const configured = { paystack: true, bachs: true }

function resolve(overrides: {
  flags?: Partial<GatewayFlags>
  configured?: Partial<typeof configured>
  baseCurrency?: 'USD' | 'NGN'
  displayCurrency?: 'USD' | 'NGN'
  requestedCharge?: 'USD' | 'NGN' | null
} = {}) {
  return resolveCheckoutOptions({
    flags: { ...flags, ...overrides.flags },
    configured: { ...configured, ...overrides.configured },
    baseCurrency: overrides.baseCurrency ?? 'USD',
    displayCurrency: overrides.displayCurrency ?? 'USD',
    requestedCharge: overrides.requestedCharge,
  })
}

describe('resolveCheckoutOptions', () => {
  it('charges NGN when USD checkout is off', () => {
    const options = resolve()
    expect(options.chargeCurrency).toBe('NGN')
    expect(options.allowCurrencyChoice).toBe(false)
    expect(options.gateways.map((g) => g.id)).toEqual(['paystack', 'bachs'])
  })

  it('charges NGN when the shopper views NGN', () => {
    const options = resolve({
      flags: { allowUsdCheckout: true },
      displayCurrency: 'NGN',
    })
    expect(options.chargeCurrency).toBe('NGN')
    expect(options.allowCurrencyChoice).toBe(false)
  })

  it('offers USD first when the admin allows it', () => {
    const options = resolve({ flags: { allowUsdCheckout: true } })
    expect(options.allowCurrencyChoice).toBe(true)
    expect(options.chargeCurrency).toBe('USD')
    expect(options.gateways.map((g) => g.id)).toEqual(['bachs'])
  })

  it('keeps both gateways when the shopper picks NGN', () => {
    const options = resolve({
      flags: { allowUsdCheckout: true },
      requestedCharge: 'NGN',
    })
    expect(options.chargeCurrency).toBe('NGN')
    expect(options.gateways.map((g) => g.id)).toEqual(['paystack', 'bachs'])
  })

  it('does not offer USD when the store base currency is NGN', () => {
    const options = resolve({
      flags: { allowUsdCheckout: true },
      baseCurrency: 'NGN',
    })
    expect(options.allowCurrencyChoice).toBe(false)
    expect(options.chargeCurrency).toBe('NGN')
  })

  it('falls back to Paystack when BACHS is off', () => {
    const options = resolve({
      flags: { allowUsdCheckout: true, bachs: false },
    })
    expect(options.allowCurrencyChoice).toBe(false)
    expect(options.chargeCurrency).toBe('NGN')
    expect(options.gateways.map((g) => g.id)).toEqual(['paystack'])
  })

  it('does not offer USD when BACHS has no key', () => {
    const options = resolve({
      flags: { allowUsdCheckout: true },
      configured: { bachs: false },
    })
    expect(options.allowCurrencyChoice).toBe(false)
    expect(options.chargeCurrency).toBe('NGN')
    expect(options.gateways.map((g) => g.id)).toEqual(['paystack'])
  })

  it('hides disabled gateways entirely', () => {
    const options = resolve({ flags: { paystack: false } })
    expect(options.gateways.map((g) => g.id)).toEqual(['bachs'])
  })

  it('returns no gateways when both are off', () => {
    const options = resolve({ flags: { paystack: false, bachs: false } })
    expect(options.gateways).toEqual([])
  })
})
