import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { headers } from 'next/headers'
import { ReturnPoller } from './return-poller'

/**
 * Blocking route: it must read `searchParams` and (for BACHS) redirect back to
 * the customer's own origin on every request, so it must never be prerendered
 * or cached. See the admin panel layout for the same `instant = false` pattern.
 */
export const instant = false

type SearchParams = Promise<Record<string, string | string[] | undefined>>

interface PageProps {
  searchParams: SearchParams
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function isLoopback(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname)
}

/**
 * Checkout return page.
 *
 * Runs server-side on purpose, because two things must work before any client
 * script runs:
 *
 *  1. BACHS can only return to a public URL, so its success/cancel hop lands on
 *     `APP_URL` (the tunnel) carrying `&app=<the customer's own origin>`. We
 *     redirect the browser straight back to localhost:3000 here, where the
 *     customer actually is. Only loopback targets are accepted, so this can
 *     never be used as an open redirect.
 *  2. `cancel=1` renders the cancelled state as plain HTML.
 *
 * Everything after that is the client poller.
 */
export default async function CheckoutReturnPage({ searchParams }: PageProps) {
  await connection()
  const sp = await searchParams

  const order = first(sp.order) ?? ''
  const ref = first(sp.ref) ?? ''
  // BACHS appends ?checkout_id= to success_url; the poller forwards it as a
  // lookup hint only — the API always re-verifies the session with BACHS.
  const checkoutId = first(sp.checkout_id)
  const cancelled = first(sp.cancel) === '1'

  const app = first(sp.app)
  let appOrigin: URL | null = null
  if (app) {
    try {
      appOrigin = new URL(app)
    } catch {
      appOrigin = null
    }
  }

  if (
    appOrigin &&
    (appOrigin.protocol === 'http:' || appOrigin.protocol === 'https:') &&
    isLoopback(appOrigin.hostname)
  ) {
    const h = await headers()
    const host = h.get('host') ?? ''
    const proto = h.get('x-forwarded-proto') ?? 'http'
    if (appOrigin.origin !== `${proto}://${host}`) {
      const q = new URLSearchParams()
      for (const [k, v] of Object.entries(sp)) {
        if (k === 'app' || v == null) continue
        q.set(k, Array.isArray(v) ? v[0] : v)
      }
      redirect(`${appOrigin.origin}/checkout/return?${q.toString()}`)
    }
  }

  if (cancelled) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-body-lg text-muted">Checkout cancelled. You have not been charged.</p>
        {order ? (
          <Link
            href={`/order/${order}`}
            className="mt-6 inline-flex min-h-11 items-center rounded-pill border border-border-subtle bg-card px-6 text-body font-medium text-primary"
          >
            View order
          </Link>
        ) : (
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-11 items-center rounded-pill border border-border-subtle bg-card px-6 text-body font-medium text-primary"
          >
            Continue shopping
          </Link>
        )}
      </div>
    )
  }

  if (!ref || !order) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-body-lg text-muted">
          We couldn&apos;t match this return to an order. Check your order number to see its status.
        </p>
        <Link
          href="/track"
          className="mt-6 inline-flex min-h-11 items-center rounded-pill border border-border-subtle bg-card px-6 text-body font-medium text-primary"
        >
          Track an order
        </Link>
      </div>
    )
  }

  return <ReturnPoller reference={ref} order={order} checkoutId={checkoutId} />
}
