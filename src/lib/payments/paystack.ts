import crypto from 'node:crypto'
import { Currency } from '@/lib/currency'

const PAYSTACK_BASE = 'https://api.paystack.co'

export interface PaystackInitRes {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export async function paystackInitialize(opts: {
  email: string
  amountSubunit: number
  currency: Currency
  reference: string
  callbackUrl?: string
  metadata?: Record<string, unknown>
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured')

  const payload: {
    email: string
    amount: string
    currency: Currency
    reference: string
    callback_url?: string
    metadata?: Record<string, unknown>
  } = {
    email: opts.email,
    amount: Math.round(opts.amountSubunit).toString(),
    currency: opts.currency,
    reference: opts.reference,
    callback_url: opts.callbackUrl,
  }
  if (opts.metadata) payload.metadata = opts.metadata

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Paystack init failed: ${res.status} ${text}`)
  }
  const json = (await res.json()) as PaystackInitRes
  if (!json.status || !json.data) throw new Error(`Paystack init error: ${json.message}`)
  return json.data
}

export interface PaystackVerifyRes {
  status: boolean
  message: string
  data?: {
    status: 'success' | 'failed' | 'abandoned' | string
    amount: number // subunit
    currency: Currency
    reference: string
    paid_at?: string
    gateway_response?: string
  }
}

export async function paystackVerify(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured')

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Paystack verify failed: ${res.status} ${text}`)
  }
  const json = (await res.json()) as PaystackVerifyRes
  if (!json.status || !json.data) throw new Error(`Paystack verify error: ${json.message}`)
  return json.data
}

export function verifyPaystackSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !signatureHeader) return false
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signatureHeader))
  } catch {
    return hash === signatureHeader
  }
}
