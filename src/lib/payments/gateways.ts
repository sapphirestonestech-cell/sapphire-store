import { Currency } from '@/lib/currency'
import { SettingModel } from '@/lib/models/settings'
import { connectDb } from '@/lib/db'

export type Gateway = 'paystack' | 'bachs'

const SUPPORTED: Record<Gateway, Currency[]> = {
  paystack: ['NGN', 'USD'],
  bachs: ['USD', 'NGN'],
}

export async function getEnabledGateways() {
  await connectDb()
  try {
    const s = await SettingModel.findOne({ key: 'payment_gateways' }).lean()
    const parsed = parseGatewayFlags(s?.value)
    if (parsed) return parsed
  } catch {
    // Corrupt/unreadable setting — fall through to defaults below.
  }
  return { paystack: true, bachs: true }
}

/**
 * The payment_gateways setting is stored as a JSON string (SettingModel.value
 * is a String path — an object there fails mongoose's cast). Returns null when
 * absent or unreadable so callers can apply defaults.
 */
export function parseGatewayFlags(
  raw: unknown,
): { paystack: boolean; bachs: boolean } | null {
  if (typeof raw !== 'string') return null
  try {
    const v: unknown = JSON.parse(raw)
    if (!v || typeof v !== 'object') return null
    const { paystack, bachs } = v as { paystack?: unknown; bachs?: unknown }
    return { paystack: paystack !== false, bachs: bachs !== false }
  } catch {
    return null
  }
}

export function gatewaySupportsCurrency(g: Gateway, c: Currency) {
  return SUPPORTED[g].includes(c)
}
