import { NextRequest, NextResponse } from 'next/server'
import { getEnabledGateways, gatewayMode, gatewaySupportsCurrency, Gateway } from '@/lib/payments/gateways'
import { readGatewayKey } from '@/lib/payments/keys'
import { Currency } from '@/lib/currency'

export async function GET(req: NextRequest) {
  const displayCurrency = (req.nextUrl.searchParams.get('currency') as Currency) || 'USD'
  const enabled = await getEnabledGateways()
  // The currency the gateway will actually be charged in. "Always pay in
  // naira" converts every order to NGN at the frozen rate, which re-enables
  // Paystack for USD-displaying customers (Paystack here only accepts NGN);
  // otherwise the charge currency is the display currency and Paystack is
  // hidden for USD.
  const chargeCurrency: Currency = enabled.alwaysPayInNaira ? 'NGN' : displayCurrency
  // A gateway flagged on but missing the key for its selected mode is shown as
  // unavailable, so checkout never offers a method that cannot initialize.
  const configured: Record<Gateway, boolean> = {
    paystack: readGatewayKey('paystack', gatewayMode(enabled, 'paystack')) !== null,
    bachs: readGatewayKey('bachs', gatewayMode(enabled, 'bachs')) !== null,
  }
  const out: Array<{ id: Gateway; enabled: boolean; supports: boolean; note?: string }> = [
    {
      id: 'paystack',
      enabled: enabled.paystack && configured.paystack,
      supports: gatewaySupportsCurrency('paystack', chargeCurrency),
      note: !configured.paystack
        ? 'Paystack is temporarily unavailable.'
        : !gatewaySupportsCurrency('paystack', chargeCurrency)
          ? `Paystack does not support ${chargeCurrency} in this setup.`
          : undefined,
    },
    {
      id: 'bachs',
      enabled: enabled.bachs && configured.bachs,
      supports: gatewaySupportsCurrency('bachs', chargeCurrency),
      note: !configured.bachs
        ? 'BACHS is temporarily unavailable.'
        : !gatewaySupportsCurrency('bachs', chargeCurrency)
          ? `BACHS does not support ${chargeCurrency} in this setup.`
          : undefined,
    },
  ]
  return NextResponse.json({ gateways: out, chargeCurrency })
}
