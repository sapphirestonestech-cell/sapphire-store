import { describe, expect, it } from 'vitest'
import { parseGatewayFlags } from '@/lib/payments/gateways'

describe('parseGatewayFlags', () => {
  it('reads the new USD setting', () => {
    const flags = parseGatewayFlags(
      JSON.stringify({ paystack: true, bachs: false, allowUsdCheckout: true }),
    )
    expect(flags).toMatchObject({
      paystack: true,
      bachs: false,
      allowUsdCheckout: true,
    })
  })

  it('ignores the retired alwaysPayInNaira field', () => {
    const flags = parseGatewayFlags(
      JSON.stringify({ alwaysPayInNaira: false, bachs: true }),
    )
    expect(flags).toMatchObject({
      bachs: true,
      allowUsdCheckout: false,
    })
    expect(flags).not.toHaveProperty('alwaysPayInNaira')
  })

  it('defaults USD checkout off for old rows', () => {
    expect(parseGatewayFlags(JSON.stringify({}))).toMatchObject({
      allowUsdCheckout: false,
      paystackMode: 'live',
      bachsMode: 'live',
    })
  })
})
