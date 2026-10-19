import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { connectDb } from '@/lib/db'
import { SettingModel } from '@/lib/models/settings'
import { parseGatewayFlags } from '@/lib/payments/gateways'

const DEFAULTS = { paystack: true, bachs: true }

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
    await connectDb()
    const s = await SettingModel.findOne({ key: 'payment_gateways' }).lean()
    return NextResponse.json({ gateways: parseGatewayFlags(s?.value) ?? DEFAULTS })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const { paystack, bachs } = body as { paystack?: unknown; bachs?: unknown }
    const value = JSON.stringify({ paystack: !!paystack, bachs: !!bachs })
    await connectDb()
    await SettingModel.findOneAndUpdate(
      { key: 'payment_gateways' },
      { $set: { value } },
      { upsert: true, new: true },
    )
    return NextResponse.json({ gateways: { paystack: !!paystack, bachs: !!bachs } })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
