import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db'
import { OrderModel } from '@/lib/models/order'
import { paystackVerify } from '@/lib/payments/paystack'
import { bachsGetCheckout } from '@/lib/payments/bachs'
import { chargeMatches } from '@/lib/payments'
import { decimalStringToMinor, fulfilPaidOrder } from '@/lib/payments/fulfil'

export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference: ref } = await params
    if (!ref) return NextResponse.json({ error: 'reference required' }, { status: 400 })
    await connectDb()
    // ?order= is a fallback for reference rotation: a re-initialized payment
    // overwrites paymentReference, so an old return URL must find the order by
    // its own number instead (DECISIONS 2026-10-18).
    const orderNumber = req.nextUrl.searchParams.get('order')
    let order = await OrderModel.findOne({ paymentReference: ref })
    if (!order && orderNumber) order = await OrderModel.findOne({ orderNumber })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.status === 'pending_payment' && order.paymentGateway === 'paystack') {
      try {
        const v = await paystackVerify(ref)
        if (v.status === 'success' && chargeMatches(order, v.amount, v.currency)) {
          await fulfilPaidOrder(order, v.paid_at ? new Date(v.paid_at) : new Date())
        }
      } catch {
        // Verify failed (network/gateway hiccup) — keep polling; the webhook path can still fulfil.
      }
    }

    if (order.status === 'pending_payment' && order.paymentGateway === 'bachs') {
      // The return URL carries ?checkout_id= (BACHS appends it). It is only a
      // lookup hint: the session is fetched from BACHS with our secret key and
      // matched against this order before anything is fulfilled.
      const checkoutId = order.paymentCheckoutId || req.nextUrl.searchParams.get('checkout_id') || ''
      if (checkoutId) {
        try {
          const session = await bachsGetCheckout(checkoutId)
          const paymentCollected =
            session.payment_status === undefined ||
            session.payment_status === 'paid' ||
            // The checkout-session object reports "succeeded"; the checkout.completed
            // event reports "paid" for the same state (DECISIONS: accept both).
            session.payment_status === 'succeeded'
          const paid =
            session.status === 'completed' &&
            paymentCollected &&
            chargeMatches(order, decimalStringToMinor(String(session.amount ?? '')), session.currency) &&
            // A rotated reference means a newer initialize overwrote
            // paymentReference; our refs always start with the order number,
            // so that prefix still proves this session was created for this order.
            (!session.reference ||
              session.reference === order.paymentReference ||
              session.reference.startsWith(`${order.orderNumber}-`))
          if (paid) {
            if (!order.paymentCheckoutId) order.paymentCheckoutId = checkoutId
            await fulfilPaidOrder(order)
          }
        } catch (e) {
          // Retrieve failed (network/gateway hiccup) — keep polling; the webhook path can still fulfil.
          console.warn(
            `[payments] BACHS retrieve failed for order ${order.orderNumber} (ref ${ref}): ${e instanceof Error ? e.message : String(e)}`,
          )
        }
      }
    }

    return NextResponse.json({
      status: order.status,
      paymentGateway: order.paymentGateway,
      paymentReference: order.paymentReference,
      totalMinor: order.totalMinor,
      currency: order.currency,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to verify'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
