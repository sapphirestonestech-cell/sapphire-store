import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { connectDb } from '@/lib/db'
import { SettingModel } from '@/lib/models/settings'
import { parseGatewayFlags } from '@/lib/payments/gateways'

const DEFAULTS = { paystack: true, bachs: true, alwaysPayInNaira: false }

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
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
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const body = await req.json().catch(() => ({}))
    const { paystack, bachs, alwaysPayInNaira } = body as {
      paystack?: unknown
      bachs?: unknown
      alwaysPayInNaira?: unknown
    }
    const value = JSON.stringify({
      paystack: !!paystack,
      bachs: !!bachs,
      alwaysPayInNaira: alwaysPayInNaira === true,
    })
    await connectDb()
    await SettingModel.findOneAndUpdate(
      { key: 'payment_gateways' },
      { $set: { value } },
      { upsert: true, new: true },
    )
    return NextResponse.json({
      gateways: {
        paystack: !!paystack,
        bachs: !!bachs,
        alwaysPayInNaira: alwaysPayInNaira === true,
      },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
