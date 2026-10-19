import crypto from 'node:crypto'
import { Currency } from '@/lib/currency'

const BACHS_SANDBOX = 'https://sandbox-api.bachs.io'
const BACHS_PROD = 'https://api.bachs.io'

function getBaseUrl() {
  const env = process.env.NODE_ENV
  // If live, use prod; default to sandbox for safety
  if (env === 'production') return BACHS_PROD
  return BACHS_SANDBOX
}

export async function bachsCreateCheckout(opts: {
  amountDecimal: string // e.g. "29.00"
  currency: Currency
  reference: string
  successUrl: string
  cancelUrl: string
  customerEmail: string
  customerName?: string
  metadata?: Record<string, unknown>
}) {
  const secret = process.env.BACHS_SECRET_KEY
  if (!secret) throw new Error('BACHS_SECRET_KEY is not configured')

  const payload: {
    pricing: { currency: Currency; amount: string }
    reference: string
    success_url: string
    cancel_url: string
    customer: { email: string; name?: string }
    metadata?: Record<string, unknown>
  } = {
    pricing: { currency: opts.currency, amount: opts.amountDecimal },
    reference: opts.reference,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    customer: opts.customerName
      ? { email: opts.customerEmail, name: opts.customerName }
      : { email: opts.customerEmail },
  }
  if (opts.metadata) payload.metadata = opts.metadata

  const res = await fetch(`${getBaseUrl()}/v1/checkout-sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Bachs checkout create failed: ${res.status} ${text}`)
  }
  const json = await res.json()
  return {
    checkout_id: json.checkout_id as string,
    checkout_url: json.checkout_url as string,
  }
}

export type BachsCheckoutSession = {
  checkout_id?: string
  status?: string
  payment_status?: string
  amount?: string
  currency?: string
  reference?: string | null
}

/**
 * Retrieve a checkout session server-side. Used by the return-page poller to
 * fulfil a BACHS order without trusting the redirect (docs: the redirect can
 * be lost or faked — always confirm with a retrieve call).
 */
export async function bachsGetCheckout(checkoutId: string): Promise<BachsCheckoutSession> {
  const secret = process.env.BACHS_SECRET_KEY
  if (!secret) throw new Error('BACHS_SECRET_KEY is not configured')
  const res = await fetch(
    `${getBaseUrl()}/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`,
    {
      headers: { Authorization: `Bearer ${secret.trim()}` },
      cache: 'no-store',
    },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Bachs checkout retrieve failed: ${res.status} ${text}`)
  }
  return res.json()
}

/**
 * Verify an X-Bachs-Signature-V2 header per BACHS docs: signed message is
 * "{timestamp}.{raw_body}" with HMAC-SHA256 under the endpoint's signing
 * secret (BACHS_WEBHOOK_SECRET — never the API key), a ±300s timestamp
 * tolerance against replay, and acceptance of ANY v1= value so a secret
 * rotation mid-deploy keeps verifying. Fails closed until the secret is set.
 */
export function verifyBachsSignature(
  rawBody: string,
  headers: Headers | Record<string, string | null | undefined>,
) {
  const secret = process.env.BACHS_WEBHOOK_SECRET
  if (!secret) return false
  const v2 =
    headers instanceof Headers
      ? headers.get('x-bachs-signature-v2')
      : headers['x-bachs-signature-v2']
  if (!v2) return false

  let timestamp = ''
  const signatures: string[] = []
  for (const part of String(v2).split(',')) {
    if (part.startsWith('t=')) timestamp = part.slice(2)
    else if (part.startsWith('v1=')) signatures.push(part.slice(3))
  }
  if (!timestamp || signatures.length === 0) return false

  const ts = Number.parseInt(timestamp, 10)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false

  const expected = crypto
    .createHmac('sha256', secret.trim())
    .update(`${ts}.${rawBody}`, 'utf8')
    .digest('hex')

  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    } catch {
      // Length mismatch can't be equal; timingSafeEqual throws on it.
      return false
    }
  })
}
