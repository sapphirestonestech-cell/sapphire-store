'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Client half of the checkout return page: polls our verification endpoint
 * until the gateway confirms the charge, then sends the customer to their order.
 * The cancel state and the cross-origin bounce live in the server component, so
 * neither depends on this script loading.
 */
export function ReturnPoller({
  reference,
  order,
  checkoutId,
}: {
  reference: string
  order: string
  checkoutId?: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending' | 'failed'>('checking')

  useEffect(() => {
    async function poll() {
      try {
        if (!reference) return
        const query = new URLSearchParams({ order })
        if (checkoutId) query.set('checkout_id', checkoutId)
        const res = await fetch(`/api/payments/${reference}?${query}`, { cache: 'no-store' })
        if (!res.ok) {
          setStatus('pending')
          return
        }
        const j = await res.json()
        if (j.status === 'paid') {
          setStatus('paid')
          router.replace(`/order/${order}`)
          return
        }
        if (j.status === 'failed' || j.status === 'cancelled') {
          setStatus('failed')
          return
        }
        setStatus('pending')
      } catch {
        setStatus('pending')
      }
    }
    poll()
    const intervalId = setInterval(poll, 2000)
    return () => clearInterval(intervalId)
  }, [reference, order, router, checkoutId])

  if (status === 'paid') {
    return <div className="mx-auto max-w-xl py-16 text-center">Payment confirmed. Redirecting...</div>
  }
  if (status === 'failed') {
    return <div className="mx-auto max-w-xl py-16 text-center">Payment failed. Please try again.</div>
  }
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-body-lg text-soft-taupe">Checking your payment...</p>
    </div>
  )
}
