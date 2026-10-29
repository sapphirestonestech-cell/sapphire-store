import { Currency } from '@/lib/currency'
import { SettingModel } from '@/lib/models/settings'
import { connectDb } from '@/lib/db'
import { isPaymentMode, type PaymentMode } from '@/lib/payments/keys'

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
  /** When on (and the store is priced in USD), a USD shopper may choose USD or NGN. */
  allowUsdCheckout: boolean
  /** Which credential set the admin chose for each gateway (DECISIONS 2026-10-29). */
  paystackMode: PaymentMode
  bachsMode: PaymentMode
}

const DEFAULT_FLAGS: GatewayFlags = {
  paystack: true,
  bachs: true,
  allowUsdCheckout: false,
  paystackMode: 'live',
  bachsMode: 'live',
}

/** The selected mode for a gateway. */
export function gatewayMode(flags: GatewayFlags, gateway: Gateway): PaymentMode {
  return gateway === 'paystack' ? flags.paystackMode : flags.bachsMode
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
 * absent or unreadable so callers can apply defaults. `allowUsdCheckout`
 * defaults to false (every charge is NGN), and both modes default to live,
 * for rows written before those fields existed. The retired
 * `alwaysPayInNaira` field is ignored.
 */
export function parseGatewayFlags(raw: unknown): GatewayFlags | null {
  if (typeof raw !== 'string') return null
  try {
    const v: unknown = JSON.parse(raw)
    if (!v || typeof v !== 'object') return null
    const { paystack, bachs, allowUsdCheckout, paystackMode, bachsMode } =
      v as {
        paystack?: unknown
        bachs?: unknown
        allowUsdCheckout?: unknown
        paystackMode?: unknown
        bachsMode?: unknown
      }
    return {
      paystack: paystack !== false,
      bachs: bachs !== false,
      allowUsdCheckout: allowUsdCheckout === true,
      paystackMode: isPaymentMode(paystackMode) ? paystackMode : 'live',
      bachsMode: isPaymentMode(bachsMode) ? bachsMode : 'live',
    }
  } catch {
    return null
  }
}

export function gatewaySupportsCurrency(g: Gateway, c: Currency) {
  return SUPPORTED[g].includes(c)
}
