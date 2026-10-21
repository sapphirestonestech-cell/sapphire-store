import { Currency } from '@/lib/currency'
import { SettingModel } from '@/lib/models/settings'
import { connectDb } from '@/lib/db'

export type Gateway = 'paystack' | 'bachs'

const SUPPORTED: Record<Gateway, Currency[]> = {
  // Paystack on this merchant account only accepts NGN (a USD initialize
  // returns 403 unsupported_currency — client report, 2026-10-21). BACHS
  // accepts both.
  paystack: ['NGN'],
  bachs: ['USD', 'NGN'],
}

export interface GatewayFlags {
  paystack: boolean
  bachs: boolean
  /** When on, every payment is charged in NGN at the order's frozen rate. */
  alwaysPayInNaira: boolean
}

const DEFAULT_FLAGS: GatewayFlags = {
  paystack: true,
  bachs: true,
  alwaysPayInNaira: false,
}

export async function getEnabledGateways(): Promise<GatewayFlags> {
  await connectDb()
  try {
    const s = await SettingModel.findOne({ key: 'payment_gateways' }).lean()
    const parsed = parseGatewayFlags(s?.value)
    if (parsed) return parsed
  } catch {
    // Corrupt/unreadable setting — fall through to defaults below.
  }
  return DEFAULT_FLAGS
}

/**
 * The payment_gateways setting is stored as a JSON string (SettingModel.value
 * is a String path — an object there fails mongoose's cast). Returns null when
 * absent or unreadable so callers can apply defaults. `alwaysPayInNaira`
 * defaults to false for rows written before the field existed.
 */
export function parseGatewayFlags(raw: unknown): GatewayFlags | null {
  if (typeof raw !== 'string') return null
  try {
    const v: unknown = JSON.parse(raw)
    if (!v || typeof v !== 'object') return null
    const { paystack, bachs, alwaysPayInNaira } = v as {
      paystack?: unknown
      bachs?: unknown
      alwaysPayInNaira?: unknown
    }
    return {
      paystack: paystack !== false,
      bachs: bachs !== false,
      alwaysPayInNaira: alwaysPayInNaira === true,
    }
  } catch {
    return null
  }
}

export function gatewaySupportsCurrency(g: Gateway, c: Currency) {
  return SUPPORTED[g].includes(c)
}
