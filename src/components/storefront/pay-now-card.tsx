"use client";

import { useState } from "react";
import { fromMinor } from "@/lib/checkout";
import { formatPrice } from "@/lib/currency";
import { usePaymentOptions } from "@/components/storefront/use-payment-options";

/**
 * Client component for the order confirmation page. Offers only the gateways
 * the admin has enabled for this order's currency, including the USD/NGN
 * choice when the store allows it.
 */
export function PayNowCard({
  orderNumber,
  defaultGateway,
}: {
  orderNumber: string;
  defaultGateway: "paystack" | "bachs" | null;
}) {
  const {
    options,
    gateway,
    setGateway,
    selectCharge,
    loading: loadingOptions,
    error: optionsError,
  } = usePaymentOptions({ orderNumber, preferredGateway: defaultGateway });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!options || !gateway) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          gateway,
          chargeCurrency: options.chargeCurrency,
        }),
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

      {options?.allowCurrencyChoice ? (
        <fieldset className="mt-4">
          <legend className="text-label text-muted">Charge currency</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["USD", "NGN"] as const).map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-body font-medium transition-colors ${
                  options.chargeCurrency === option
                    ? "border-accent bg-accent/20 text-primary"
                    : "border-border-subtle bg-card text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="charge-currency"
                  value={option}
                  checked={options.chargeCurrency === option}
                  onChange={() => selectCharge(option)}
                  className="size-4 accent-accent"
                />
                {option === "USD" ? "USD" : "NGN"}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {options?.chargeCurrency === "NGN" &&
      options.displayCurrency === "USD" ? (
        <p className="mt-3 text-body text-muted">
          {typeof options.chargeAmountMinor === "number"
            ? `You’ll be charged ${formatPrice(
                fromMinor(options.chargeAmountMinor),
                "NGN",
              )} now — the naira equivalent at the rate locked on your order.`
            : "You’ll be charged in naira at the rate locked on your order."}
        </p>
      ) : null}

      {loadingOptions ? (
        <p className="mt-3 text-body text-muted">Loading payment methods…</p>
      ) : null}
      {optionsError ? (
        <p role="alert" className="mt-3 text-body text-danger">
          {optionsError}
        </p>
      ) : null}

      {options && options.gateways.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.gateways.map((option) => (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-body font-medium transition-colors ${
                gateway === option.id
                  ? "border-accent bg-accent/20 text-primary"
                  : "border-border-subtle bg-card text-muted"
              }`}
            >
              <input
                type="radio"
                name="gateway"
                value={option.id}
                checked={gateway === option.id}
                onChange={() => setGateway(option.id)}
                className="sr-only"
              />
              {option.id === "paystack" ? "Paystack" : "BACHS"}
            </label>
          ))}
        </div>
      ) : null}

      {!loadingOptions && !optionsError && options?.gateways.length === 0 ? (
        <p className="mt-3 text-body text-muted">
          No payment methods are available right now. Please contact us to
          complete this order.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-body text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || loadingOptions || !options || !gateway}
        className="mt-4 inline-flex min-h-12 items-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow disabled:bg-border-default disabled:text-muted disabled:shadow-none"
      >
        {loading ? "Redirecting…" : "Pay now"}
      </button>
    </div>
  );
}
