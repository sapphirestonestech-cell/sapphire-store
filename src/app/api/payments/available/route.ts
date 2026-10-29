import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db'
import { isCurrency, type Currency } from '@/lib/currency'
import { OrderModel } from '@/lib/models/order'
import { getSettings } from '@/lib/settings'
import { chargeAmountForOrder } from '@/lib/payments'
import { getEnabledGateways, gatewayMode, type Gateway } from '@/lib/payments/gateways'
import { resolveCheckoutOptions } from '@/lib/payments/checkout-options'
import { readGatewayKey } from '@/lib/payments/keys'

/**
 * GET /api/payments/available — the gateways a customer may see and the
 * currency they will be charged in. An `order` number pins the answer to that
 * order's display/base currency; otherwise `currency` is the shopper's current
 * display currency. `charge` carries the customer's USD/NGN choice.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const orderNumber = params.get('order')
  const displayParam = params.get('currency')
  const chargeParam = params.get('charge')

  let displayCurrency: Currency = isCurrency(displayParam) ? displayParam : 'USD'
  let baseCurrency: Currency | null = null
  let order = null

  if (orderNumber) {
    await connectDb()
    order = await OrderModel.findOne({ orderNumber }).lean()
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    displayCurrency = order.currency
    baseCurrency = order.baseCurrency
  }

  const enabled = await getEnabledGateways()
  const configured: Record<Gateway, boolean> = {
    paystack: readGatewayKey('paystack', gatewayMode(enabled, 'paystack')) !== null,
    bachs: readGatewayKey('bachs', gatewayMode(enabled, 'bachs')) !== null,
  }
  if (!baseCurrency) {
    baseCurrency = (await getSettings()).baseCurrency
  }

  const options = resolveCheckoutOptions({
    flags: enabled,
    configured,
    baseCurrency,
    displayCurrency,
    requestedCharge: isCurrency(chargeParam) ? chargeParam : null,
  })

  return NextResponse.json(
    {
      ...options,
      displayCurrency,
      baseCurrency,
      chargeAmountMinor: order
        ? chargeAmountForOrder(order, options.chargeCurrency).minor
        : undefined,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
