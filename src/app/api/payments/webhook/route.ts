import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db'
import { OrderModel } from '@/lib/models/order'
import { verifyPaystackSignature } from '@/lib/payments/paystack'
import { verifyBachsSignature } from '@/lib/payments/bachs'
import { chargeMatches } from '@/lib/payments'
import { decimalStringToMinor, fulfilPaidOrder } from '@/lib/payments/fulfil'
import { paymentModeOrDefault, readGatewayKey } from '@/lib/payments/keys'

export async function POST(req: NextRequest) {
  const raw = await req.text()

  const paystackSig = req.headers.get('x-paystack-signature')
  const bachsSig = req.headers.get('x-bachs-signature-v2')

  let gateway: 'paystack' | 'bachs' | null = null
  if (paystackSig) gateway = 'paystack'
  if (bachsSig) gateway = 'bachs'

  if (!gateway) {
    try {
      const p = JSON.parse(raw)
      if (p?.event) gateway = 'paystack'
      if (p?.type) gateway = 'bachs'
    } catch {
      // fall through to unknown-gateway 400 below
    }
  }
  if (!gateway) return NextResponse.json({ error: 'Unknown webhook' }, { status: 400 })

  await connectDb()

  if (gateway === 'paystack') {
    if (!paystackSig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
    let body: {
      event?: string
      data?: { reference?: string; amount?: number; currency?: string }
    }
    try {
      body = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Verify with the key for the mode this order was initialized in. An
    // unknown reference could belong to either mode, so try both keys.
    const reference = body?.data?.reference
    const known = reference
      ? await OrderModel.findOne({ paymentReference: reference })
          .select('paymentMode')
          .lean()
      : null
    const mode = paymentModeOrDefault(
      (known as { paymentMode?: string } | null)?.paymentMode,
    )
    let signatureValid = false
    const modeKey = readGatewayKey('paystack', mode)
    if (modeKey) {
      signatureValid = verifyPaystackSignature(raw, paystackSig, modeKey)
    }
    if (!signatureValid && !known) {
      for (const candidate of ['test', 'live'] as const) {
        if (candidate === mode) continue
        const key = readGatewayKey('paystack', candidate)
        if (key && verifyPaystackSignature(raw, paystackSig, key)) {
          signatureValid = true
          break
        }
      }
    }
    if (!signatureValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (body?.event !== 'charge.success') {
      return NextResponse.json({ ok: true })
    }
    const data = body?.data || {}
    if (!reference) return NextResponse.json({ ok: true })
    const order = await OrderModel.findOne({ paymentReference: reference })
    if (!order) return NextResponse.json({ ok: true })
    if (order.status === 'paid') return NextResponse.json({ ok: true, alreadyPaid: true })
    if (!chargeMatches(order, Number(data?.amount ?? 0), data?.currency)) {
      // Paystack retries non-2xx answers and can disable the endpoint after
      // repeated failures; a short/over payment must not fulfil either way, so
      // acknowledge and leave the order pending for admin reconciliation.
      console.warn(
        `[webhooks] Paystack amount/currency mismatch for order ${order.orderNumber}: got ${String(data?.amount)} ${String(data?.currency)}, expected minor ${order.paymentAmountMinor ?? order.totalMinor} ${order.paymentCurrency ?? order.currency} — left pending for admin reconciliation.`,
      )
      return NextResponse.json({ ok: true })
    }
    if (order.status === 'pending_payment') {
      await fulfilPaidOrder(order)
    }
    return NextResponse.json({ ok: true })
  }

  // BACHS — signature required, then DECISIONS.md policy: only a full
  // SUCCEEDED charge / paid checkout fulfils; everything else (ACCEPTED,
  // OVERPAID, no_payment_required, amount/currency mismatch) is logged and
  // answered 200, because non-2xx answers get an endpoint disabled by BACHS.
  if (!verifyBachsSignature(raw, req.headers)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  const body = JSON.parse(raw)
  const type = body?.type as string | undefined
  if (type !== 'collection.succeeded' && type !== 'checkout.completed') {
    return NextResponse.json({ ok: true })
  }
  const data = body?.data || {}
  const reference = (data?.reference as string | undefined) || undefined
  const checkoutId = (data?.checkout_id as string | undefined) || undefined

  let order = reference ? await OrderModel.findOne({ paymentReference: reference }) : null
  if (!order && checkoutId) order = await OrderModel.findOne({ paymentCheckoutId: checkoutId })
  if (!order) return NextResponse.json({ ok: true })
  if (order.status === 'paid') return NextResponse.json({ ok: true, alreadyPaid: true })

  const collectionSucceeded = type === 'collection.succeeded' && data?.status === 'SUCCEEDED'
  // checkout.completed events report payment_status "paid"; the checkout object
  // uses "succeeded" for the same state — accept both (DECISIONS 2026-10-18).
  const checkoutPaid =
    type === 'checkout.completed' &&
    (data?.payment_status === 'paid' || data?.payment_status === 'succeeded')
  if (!collectionSucceeded && !checkoutPaid) {
    console.warn(
      `[webhooks] BACHS ${type} with status "${String(data?.status ?? data?.payment_status)}" for order ${order.orderNumber} — not auto-fulfilled, left pending for admin reconciliation.`,
    )
    return NextResponse.json({ ok: true })
  }

  const amountMinor = decimalStringToMinor(String(data?.amount ?? ''))
  if (!chargeMatches(order, amountMinor, data?.currency)) {
    console.warn(
      `[webhooks] BACHS amount/currency mismatch for order ${order.orderNumber}: got ${String(data?.amount)} ${String(data?.currency)}, expected minor ${order.paymentAmountMinor ?? order.totalMinor} ${order.paymentCurrency ?? order.currency} — left pending for admin reconciliation.`,
    )
    return NextResponse.json({ ok: true })
  }

  if (order.status === 'pending_payment') {
    if (checkoutId && !order.paymentCheckoutId) order.paymentCheckoutId = checkoutId
    await fulfilPaidOrder(order)
  }
  return NextResponse.json({ ok: true })
}
