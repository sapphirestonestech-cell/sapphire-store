"use client";

import { useState } from "react";

/**
 * Client component for the order confirmation page. Lets a customer pick a
 * payment gateway (Paystack or BACHS) and initializes payment, redirecting
 * them to the gateway's secure checkout page.
 */
export function PayNowCard({
  orderNumber,
  defaultGateway,
}: {
  orderNumber: string;
  defaultGateway: "paystack" | "bachs" | null;
}) {
  const [gateway, setGateway] = useState<"paystack" | "bachs">(defaultGateway ?? "paystack");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, gateway }),
      });
      const data = (await res.json()) as { paymentUrl?: string; error?: string };
      if (!res.ok || !data.paymentUrl) {
        setError(data.error ?? "We couldn't start payment. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      setError("We couldn't start payment. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-accent-wash bg-accent-wash/50 p-5">
      <p className="text-body text-primary">
        Your order is saved but payment hasn&apos;t been completed yet. Choose a
        payment method below to finish.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-body font-medium transition-colors ${
            gateway === "paystack"
              ? "border-accent bg-accent/20 text-primary"
              : "border-border-subtle bg-card text-muted"
          }`}
        >
          <input
            type="radio"
            name="gateway"
            value="paystack"
            checked={gateway === "paystack"}
            onChange={() => setGateway("paystack")}
            className="sr-only"
          />
          Paystack
        </label>
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-body font-medium transition-colors ${
            gateway === "bachs"
              ? "border-accent bg-accent/20 text-primary"
              : "border-border-subtle bg-card text-muted"
          }`}
        >
          <input
            type="radio"
            name="gateway"
            value="bachs"
            checked={gateway === "bachs"}
            onChange={() => setGateway("bachs")}
            className="sr-only"
          />
          BACHS
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-body text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="mt-4 inline-flex min-h-12 items-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow disabled:bg-border-default disabled:text-muted disabled:shadow-none"
      >
        {loading ? "Redirecting…" : "Pay now"}
      </button>
    </div>
  );
}
