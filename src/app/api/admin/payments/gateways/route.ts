import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { connectDb } from '@/lib/db'
import { SettingModel } from '@/lib/models/settings'
import {
  parseGatewayFlags,
  type GatewayFlags,
} from '@/lib/payments/gateways'
import {
  gatewayKeysStatus,
  gatewayKeyStatus,
  isPaymentMode,
} from '@/lib/payments/keys'

const DEFAULTS: GatewayFlags = {
  paystack: true,
  bachs: true,
  allowUsdCheckout: false,
  paystackMode: 'live',
  bachsMode: 'live',
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    await connectDb()
    const s = await SettingModel.findOne({ key: 'payment_gateways' }).lean()
    return NextResponse.json({
      gateways: parseGatewayFlags(s?.value) ?? DEFAULTS,
      keys: gatewayKeysStatus(),
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const body = (await req.json().catch(() => ({}))) as {
      paystack?: unknown
      bachs?: unknown
      allowUsdCheckout?: unknown
      paystackMode?: unknown
      bachsMode?: unknown
    }

    await connectDb()
    const currentDoc = await SettingModel.findOne({
      key: 'payment_gateways',
    }).lean()
    const current = parseGatewayFlags(currentDoc?.value) ?? DEFAULTS

    const next: GatewayFlags = {
      paystack:
        body.paystack === undefined ? current.paystack : body.paystack === true,
      bachs: body.bachs === undefined ? current.bachs : body.bachs === true,
      allowUsdCheckout:
        body.allowUsdCheckout === undefined
          ? current.allowUsdCheckout
          : body.allowUsdCheckout === true,
      paystackMode: isPaymentMode(body.paystackMode)
        ? body.paystackMode
        : current.paystackMode,
      bachsMode: isPaymentMode(body.bachsMode)
        ? body.bachsMode
        : current.bachsMode,
    }

    // A gateway may only be enabled for a mode whose key is present: switching
    // to a mode with no key would break checkout at the worst moment.
    for (const gateway of ['paystack', 'bachs'] as const) {
      if (!next[gateway]) continue
      const mode = gateway === 'paystack' ? next.paystackMode : next.bachsMode
      const status = gatewayKeyStatus(gateway, mode)
      if (!status.configured) {
        return NextResponse.json(
          {
            error: `${gateway === 'paystack' ? 'Paystack' : 'BACHS'} ${mode} mode can’t be enabled. ${status.reason ?? ''}`.trim(),
          },
          { status: 400 },
        )
      }
    }

    const value = JSON.stringify(next)
    await SettingModel.findOneAndUpdate(
      { key: 'payment_gateways' },
      { $set: { value } },
      { upsert: true, new: true },
    )
    return NextResponse.json({ gateways: next, keys: gatewayKeysStatus() })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
