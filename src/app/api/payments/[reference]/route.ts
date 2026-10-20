import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db'
import { OrderModel } from '@/lib/models/order'
import { verifyOrderPayment } from '@/lib/payments/verify'

/**
 * Return-page poll. The browser landing here is never proof of payment:
 * the boundary calls the gateway and fulfils only on an exact amount and
 * currency match (ProductReq.md §10.3, §10.5).
 */
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

    // Failures are quiet here: the page keeps polling and the webhook path can
    // still fulfil. The admin's "Verify with gateway" action surfaces messages.
    await verifyOrderPayment(order, {
      checkoutId: req.nextUrl.searchParams.get('checkout_id') ?? undefined,
    }).catch(() => {})

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
