"use client";

import Link from "next/link";
import { useState } from "react";
import { Price } from "@/components/price";
import type { Currency } from "@/lib/currency";

export interface LocationOption {
  id: string;
  label: string;
}

interface EstimateResult {
  kind: "in_stock" | "preorder" | "not_served";
  message?: string;
  locationLabel?: string;
  feeBase?: number;
  freeDelivery?: boolean;
  baseCurrency?: Currency;
  daysLabel?: string;
  arrivalLabel?: string | null;
}

/**
 * Delivery estimator — DESIGN.md §7.12. Choose a location from the
 * admin-defined list and see the fee and days before checkout.
 */
export function DeliveryEstimator({
  locations,
  productId,
  availability,
  arrivalDate,
}: {
  locations: LocationOption[];
  productId?: string;
  availability: "in_stock" | "pre_order";
  arrivalDate: string | null;
}) {
  const [locationId, setLocationId] = useState("");
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function choose(id: string) {
    setLocationId(id);
    setResult(null);
    setError(null);
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/delivery/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: id, productId, availability, arrivalDate }),
      });
      const data = (await res.json()) as EstimateResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setResult(data);
    } catch {
      setError("Delivery details are unavailable right now. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="delivery-estimator-heading" className="space-y-3">
      <h2 id="delivery-estimator-heading" className="text-body font-semibold">
        Delivery
      </h2>
      <div className="rounded-md bg-card p-5 shadow-card">
        <label htmlFor="delivery-location" className="text-body text-muted">
          Where should we deliver?
        </label>
        <select
          id="delivery-location"
          value={locationId}
          onChange={(e) => choose(e.target.value)}
          className="mt-2 h-12 w-full rounded-pill border border-border-subtle bg-card px-4 text-body text-primary"
        >
          <option value="">
            {locations.length === 0
              ? "No locations available yet"
              : "Choose your location"}
          </option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.label}
            </option>
          ))}
        </select>

        {loading ? (
          <p aria-live="polite" className="mt-3 text-body text-muted">
            Checking delivery…
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-body text-danger">
            {error}
          </p>
        ) : null}

        {result?.kind === "not_served" ? (
          <p className="mt-3 text-body text-primary">
            {result.message}{" "}
            <Link href="/contact" className="text-accent-strong underline underline-offset-4">
              Contact us
            </Link>
            .
          </p>
        ) : null}

        {result && result.kind !== "not_served" ? (
          <p aria-live="polite" className="mt-3 text-body text-primary">
            {result.kind === "preorder" ? (
              <>
                {result.arrivalLabel ? (
                  <>Arrives {result.arrivalLabel}. </>
                ) : null}
                Shipping to {result.locationLabel}:{" "}
              </>
            ) : (
              <>Delivery to {result.locationLabel}: </>
            )}
            <span className="font-semibold">
              <Price
                amount={result.feeBase ?? 0}
                baseCurrency={result.baseCurrency}
              />
            </span>
            {result.freeDelivery ? <> — free delivery</> : null}
            {result.kind === "preorder" ? (
              <>, then {result.daysLabel} after arrival</>
            ) : (
              <> · {result.daysLabel}</>
            )}
            .
          </p>
        ) : null}

        {locations.length === 0 ? (
          <p className="mt-3 text-body text-muted">
            Delivery locations are being set up. Check back soon.
          </p>
        ) : null}
      </div>
    </section>
  );
}
