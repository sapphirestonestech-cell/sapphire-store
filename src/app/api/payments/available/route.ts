import { NextRequest, NextResponse } from 'next/server'
import { getEnabledGateways, gatewaySupportsCurrency, Gateway } from '@/lib/payments/gateways'
import { Currency } from '@/lib/currency'

export async function GET(req: NextRequest) {
  const currency = (req.nextUrl.searchParams.get('currency') as Currency) || 'USD'
  const enabled = await getEnabledGateways()
  const out: Array<{ id: Gateway; enabled: boolean; supports: boolean; note?: string }> = [
    {
      id: 'paystack',
      enabled: enabled.paystack,
      supports: gatewaySupportsCurrency('paystack', currency),
      note: !gatewaySupportsCurrency('paystack', currency) ? `Paystack does not support ${currency} in this setup.` : undefined,
    },
    {
      id: 'bachs',
      enabled: enabled.bachs,
      supports: gatewaySupportsCurrency('bachs', currency),
      note: !gatewaySupportsCurrency('bachs', currency) ? `BACHS does not support ${currency} in this setup.` : undefined,
    },
  ]
  return NextResponse.json({ gateways: out })
}
