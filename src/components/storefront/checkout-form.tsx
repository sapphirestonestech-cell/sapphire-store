"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Price } from "@/components/price";
import { useCart } from "@/components/cart-provider";
import { useCurrency } from "@/components/currency-provider";
import { clearCart, type CartItem } from "@/lib/cart";
import { computeOrderTotals, fromMinor, type CheckoutItemInput } from "@/lib/checkout";

interface LocationOption {
  id: string;
  label: string;
  country: string;
  region: string | null;
  cityArea: string;
  instockFee: number;
  preorderFee: number;
  minDays: number;
  maxDays: number;
}

interface LocationsResponse {
  locations?: LocationOption[];
  error?: string;
}

function toCheckoutInput(i: CartItem): CheckoutItemInput {
  return {
    productId: i.productId,
    name: i.name,
    slug: i.slug,
    sizeLabel: i.sizeLabel,
    quantity: i.quantity,
    unitPriceBase: i.unitPriceBase,
    availability: i.availability,
    preorderArrivalDate: i.preorderArrivalDate,
    paymentMode: i.paymentMode,
    depositPercent: i.depositPercent,
    freeDelivery: i.freeDelivery,
    imageUrl: i.imageUrl ?? undefined,
  };
}

export function CheckoutForm() {
  const router = useRouter();
  const { items } = useCart();
  const { currency } = useCurrency();

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [locationId, setLocationId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/delivery/locations")
      .then((res) => res.json())
      .then((data: LocationsResponse) => {
        if (cancelled) return;
        if (data.locations) {
          setLocations(data.locations);
        } else {
          setLocationsError(data.error ?? "Delivery locations are unavailable.");
        }
      })
      .catch(() => {
        if (!cancelled) setLocationsError("Delivery locations are unavailable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const location = useMemo(
    () => locations.find((l) => l.id === locationId) ?? null,
    [locations, locationId],
  );

  const totals = useMemo(() => {
    if (!location || items.length === 0) return null;
    return computeOrderTotals(items.map(toCheckoutInput), {
      id: location.id,
      country: location.country,
      region: location.region ?? undefined,
      cityArea: location.cityArea,
      instockFee: location.instockFee,
      preorderFee: location.preorderFee,
      minDays: location.minDays,
      maxDays: location.maxDays,
    });
  }, [items, location]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!location) {
      setError("Choose a delivery location.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            sizeLabel: i.sizeLabel,
            quantity: i.quantity,
          })),
          customer: { name, email, phone, notes },
          locationId: location.id,
          currency,
        }),
      });
      const data = (await res.json()) as { orderNumber?: string; error?: string };
      if (!res.ok || !data.orderNumber) {
        setError(data.error ?? "We couldn't place your order. Try again.");
        return;
      }
      clearCart();
      router.push(`/order/${data.orderNumber}`);
    } catch {
      setError("We couldn't place your order. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && items.length === 0) {
    return (
      <div className="page-width py-16">
        <div className="mx-auto max-w-md rounded-card bg-pure-white p-6 text-center shadow-card">
          <h1 className="font-display text-heading-lg text-warm-ink">
            Nothing to check out
          </h1>
          <p className="mt-2 text-body text-soft-taupe">
            Your cart is empty right now.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow"
          >
            Browse rings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-width py-8 md:py-12">
      <h1 className="font-display text-heading-lg text-warm-ink">Checkout</h1>
      <p className="mt-1 text-body text-soft-taupe">
        Guest checkout — no account needed.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-12"
      >
        {/* Left — contact + delivery */}
        <div className="space-y-6">
          <fieldset className="rounded-card bg-pure-white p-6 shadow-card">
            <legend className="px-1 font-display text-subheading text-warm-ink">
              Your details
            </legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-body font-medium">Full name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="mt-1.5 h-12 w-full rounded-pill border border-hairline bg-pure-white px-4 text-body text-warm-ink"
                />
              </label>
              <label className="block">
                <span className="text-body font-medium">Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="mt-1.5 h-12 w-full rounded-pill border border-hairline bg-pure-white px-4 text-body text-warm-ink"
                />
              </label>
              <label className="block">
                <span className="text-body font-medium">Phone</span>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="mt-1.5 h-12 w-full rounded-pill border border-hairline bg-pure-white px-4 text-body text-warm-ink"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-body font-medium">
                  Delivery notes <span className="text-soft-taupe">(optional)</span>
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-card border border-hairline bg-pure-white p-4 text-body text-warm-ink"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-card bg-pure-white p-6 shadow-card">
            <legend className="px-1 font-display text-subheading text-warm-ink">
              Delivery
            </legend>
            <label className="mt-4 block">
              <span className="text-body font-medium">Delivery location</span>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-pill border border-hairline bg-pure-white px-4 text-body text-warm-ink"
              >
                <option value="">
                  {loading
                    ? "Loading locations…"
                    : locations.length === 0
                      ? "No locations available"
                      : "Choose your location"}
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </label>
            {locationsError ? (
              <p className="mt-2 text-body text-status-error">
                {locationsError}
              </p>
            ) : null}

            {totals && totals.shipments.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {totals.shipments.map((s) => (
                  <li
                    key={s.kind}
                    className="flex items-start justify-between gap-4 border-t border-hairline pt-3 first:border-t-0 first:pt-0"
                  >
                    <div>
                      <p className="text-body font-medium">
                        {s.kind === "in_stock" ? "In-stock rings" : "Pre-order rings"}
                      </p>
                      <p className="text-body text-soft-taupe">
                        {s.kind === "pre_order" && s.arrivalDate
                          ? `Arrives first ${new Date(s.arrivalDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" },
                            )}, ` 
                          : ""}
                        {s.minDays}–{s.maxDays} days
                      </p>
                    </div>
                    <p className="text-body font-medium">
                      {s.freeDelivery ? (
                        "Free"
                      ) : (
                        <Price amount={fromMinor(s.deliveryFeeMinor)} />
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-body text-soft-taupe">
                {location
                  ? "Delivery fee is included below."
                  : "Choose your location to see delivery time and fees."}
              </p>
            )}
          </fieldset>
        </div>

        {/* Right — summary */}
        <aside className="space-y-4 rounded-card bg-pure-white p-6 shadow-card lg:sticky lg:top-28">
          <h2 className="font-display text-subheading text-warm-ink">Order summary</h2>
          <ul className="space-y-2 text-body">
            {items.map((i) => (
              <li
                key={`${i.productId}:${i.sizeLabel}`}
                className="flex items-start justify-between gap-4"
              >
                <span className="min-w-0 text-soft-taupe">
                  {i.name}{" "}
                  <span className="text-warm-ink">· Size {i.sizeLabel}</span> ×{" "}
                  {i.quantity}
                </span>
                <span className="shrink-0 font-medium">
                  <Price amount={i.unitPriceBase * i.quantity} />
                </span>
              </li>
            ))}
          </ul>

          {totals ? (
            <dl className="space-y-2 border-t border-hairline pt-4 text-body">
              <div className="flex justify-between">
                <dt className="text-soft-taupe">Subtotal</dt>
                <dd className="font-medium">
                  <Price amount={fromMinor(totals.subtotalMinor)} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-soft-taupe">Delivery</dt>
                <dd className="font-medium">
                  {totals.deliveryTotalMinor === 0 ? (
                    "Free"
                  ) : (
                    <Price amount={fromMinor(totals.deliveryTotalMinor)} />
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 text-body-lg">
                <dt className="font-medium">Total</dt>
                <dd className="font-semibold">
                  <Price amount={fromMinor(totals.totalMinor)} />
                </dd>
              </div>
              {totals.amountDueLaterMinor > 0 ? (
                <>
                  <div className="flex justify-between pt-1 text-deep-gold">
                    <dt>Due now</dt>
                    <dd className="font-semibold">
                      <Price amount={fromMinor(totals.amountDueNowMinor)} />
                    </dd>
                  </div>
                  <div className="flex justify-between text-soft-taupe">
                    <dt>Due before shipping</dt>
                    <dd className="font-medium">
                      <Price amount={fromMinor(totals.amountDueLaterMinor)} />
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          ) : (
            <p className="border-t border-hairline pt-4 text-body text-soft-taupe">
              Total shown once you choose a location.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !location || items.length === 0}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow disabled:bg-pale-sand disabled:text-soft-taupe disabled:shadow-none"
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>

          {error ? (
            <p role="alert" className="text-body text-status-error">
              {error}
            </p>
          ) : null}

          <p className="text-body text-soft-taupe">
            Online payment is being connected. Placing an order saves it as
            awaiting payment so you don&apos;t lose your place.
          </p>
        </aside>
      </form>
    </div>
  );
}
