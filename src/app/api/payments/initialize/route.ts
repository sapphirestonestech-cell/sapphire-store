import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db'
import { OrderModel } from '@/lib/models/order'
import { Currency } from '@/lib/currency'
import { getEnabledGateways, gatewaySupportsCurrency, formatAmountForGateway, chargeAmountForOrder } from '@/lib/payments'
import { paystackInitialize } from '@/lib/payments/paystack'
import { bachsCreateCheckout } from '@/lib/payments/bachs'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { orderNumber, gateway } = body as { orderNumber: string; gateway: 'paystack' | 'bachs' }

    if (!orderNumber || !gateway) {
      return NextResponse.json({ error: 'orderNumber and gateway required' }, { status: 400 })
    }

    const enabled = await getEnabledGateways()
    if (gateway === 'paystack' && !enabled.paystack) {
      return NextResponse.json({ error: 'Paystack is not enabled' }, { status: 400 })
    }
    if (gateway === 'bachs' && !enabled.bachs) {
      return NextResponse.json({ error: 'BACHS is not enabled' }, { status: 400 })
    }

    await connectDb()
    const order = await OrderModel.findOne({ orderNumber })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'pending_payment') {
      return NextResponse.json({ error: `Order not in pending_payment (status: ${order.status})` }, { status: 400 })
    }

    // Charge currency: "Always pay in naira" converts every order to NGN at
    // the frozen order rate before the gateway sees it (Paystack on this
    // merchant account rejects USD with 403 unsupported_currency — client
    // report 2026-10-21). Otherwise charge in the order's display currency.
    const currency = order.currency as Currency
    const chargeCurrency: Currency = enabled.alwaysPayInNaira ? 'NGN' : currency
    if (!gatewaySupportsCurrency(gateway, chargeCurrency)) {
      return NextResponse.json({ error: `${gateway} does not support currency ${chargeCurrency}` }, { status: 400 })
    }

    const ref = `${order.orderNumber}-${Date.now()}-${randomUUID().slice(0, 8)}`.toUpperCase()
    // Charge the due-now amount in the charge currency — the figure the
    // customer saw, or its NGN equivalent at the frozen rate. Every `*Minor`
    // field on the order is in the base currency, so they must never be sent
    // to a gateway raw (ProductReq.md §10.2; DECISIONS 2026-10-18).
    const charge = chargeAmountForOrder(order, chargeCurrency)
    const chargedMinor = charge.minor

    // Two origins, deliberately different:
    //
    //  * `appOrigin` — the site the customer is actually browsing (localhost in
    //    dev). Paystack's `callback_url` is a plain browser redirect, so it can
    //    point straight here: the customer lands back on localhost:3000.
    //  * `publicOrigin` — a public URL, because BACHS rejects localhost in
    //    `success_url` (verified against the sandbox: "success_url must be a
    //    publicly accessible URL (localhost is not allowed)"). BACHS therefore
    //    returns to `publicOrigin` with `&app=<appOrigin>`, and the return page
    //    server-redirects the browser back to the customer's own origin.
    const appOrigin = (req.nextUrl.origin || '').replace(/\/+$/, '')
    const publicOrigin = (
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      appOrigin
    ).replace(/\/+$/, '')
    const isLocalOrigin = (() => {
      try {
        const u = new URL(publicOrigin)
        return (
          u.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)
        )
      } catch {
        return false
      }
    })()

    if (gateway === 'bachs' && isLocalOrigin) {
      return NextResponse.json(
        {
          error:
            'BACHS requires a public return URL (localhost is not allowed). Set APP_URL in .env.local to a public origin (for example a cloudflared tunnel URL) and restart the dev server.',
        },
        { status: 400 },
      )
    }

    // Send the browser back to the origin it came from; only BACHS needs the
    // public hop.
    const returnTo = gateway === 'bachs' ? publicOrigin : appOrigin
    const bounce =
      gateway === 'bachs' && appOrigin && appOrigin !== publicOrigin
        ? `&app=${encodeURIComponent(appOrigin)}`
        : ''

    if (gateway === 'paystack') {
      const { amountSubunit } = formatAmountForGateway('paystack', chargedMinor) as { amountSubunit: number }
      const init = await paystackInitialize({
        email: order.customer.email,
        amountSubunit,
        currency: charge.currency,
        reference: ref,
        callbackUrl: `${returnTo}/checkout/return?order=${order.orderNumber}&ref=${ref}`,
        metadata: { orderNumber: order.orderNumber },
      })
      order.paymentGateway = 'paystack'
      order.paymentReference = ref
      order.paymentStatus = 'initiated'
      order.paymentAmountMinor = chargedMinor
      order.paymentCurrency = charge.currency
      await order.save()
      return NextResponse.json({ paymentUrl: init.authorization_url, reference: ref })
    } else if (gateway === 'bachs') {
      const { amountDecimal } = formatAmountForGateway('bachs', chargedMinor)
      const init = await bachsCreateCheckout({
        amountDecimal,
        currency: charge.currency,
        reference: ref,
        successUrl: `${returnTo}/checkout/return?order=${order.orderNumber}&ref=${ref}&success=1${bounce}`,
        cancelUrl: `${returnTo}/checkout/return?order=${order.orderNumber}&ref=${ref}&cancel=1${bounce}`,
        customerEmail: order.customer.email,
        customerName: order.customer.name,
        metadata: { orderNumber: order.orderNumber },
      })
      order.paymentGateway = 'bachs'
      order.paymentReference = ref
      // Stored so the return-page poller can retrieve the session and verify
      // server-side instead of trusting the redirect.
      order.paymentCheckoutId = init.checkout_id
      order.paymentStatus = 'initiated'
      order.paymentAmountMinor = chargedMinor
      order.paymentCurrency = charge.currency
      await order.save()
      return NextResponse.json({ paymentUrl: init.checkout_url, reference: ref })
    }

    return NextResponse.json({ error: 'Unsupported gateway' }, { status: 400 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to initialize payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
