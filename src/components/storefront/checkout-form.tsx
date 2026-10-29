"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Price } from "@/components/price";
import { useCart } from "@/components/cart-provider";
import { useCurrency } from "@/components/currency-provider";
import { clearCart, type CartItem } from "@/lib/cart";
import { computeOrderTotals, fromMinor, type CheckoutItemInput } from "@/lib/checkout";
import { formatPrice, priceIn } from "@/lib/currency";
import { SaveForLaterButton } from "@/components/storefront/save-for-later-button";
import { usePaymentOptions } from "@/components/storefront/use-payment-options";

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

interface CheckoutPrefill {
  name: string;
  email: string;
  phone: string;
}

export function CheckoutForm({
  prefill,
}: {
  prefill?: CheckoutPrefill | null;
}) {
  const router = useRouter();
  const { items } = useCart();
  const { currency, baseCurrency, usdToNgn, rounding } = useCurrency();

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState(prefill?.name ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [locationId, setLocationId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    options,
    gateway,
    setGateway,
    selectCharge,
    loading: loadingPayments,
    error: paymentsError,
  } = usePaymentOptions({ currency });

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

  const nairaDueNow = totals
    ? priceIn(
        fromMinor(totals.amountDueNowMinor),
        baseCurrency,
        "NGN",
        usdToNgn,
        rounding,
      )
    : null;

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
      const orderNumber = data.orderNumber;

      if (gateway) {
        try {
          const initRes = await fetch("/api/payments/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderNumber,
              gateway,
              chargeCurrency: options?.chargeCurrency,
            }),
          });
          const initData = (await initRes.json()) as {
            paymentUrl?: string;
            reference?: string;
            error?: string;
          };
          if (initRes.ok && initData.paymentUrl) {
            clearCart();
            window.location.href = initData.paymentUrl;
            return;
          }
        } catch {
          // fall through to order page with Pay now button
        }
      }

      clearCart();
      router.push(`/order/${orderNumber}`);
    } catch {
      setError("We couldn't place your order. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && items.length === 0) {
    return (
      <div className="page-width py-16">
        <div className="mx-auto max-w-md rounded-md bg-card p-6 text-center shadow-card">
          <h1 className="font-sans text-heading-lg text-primary">
            Nothing to check out
          </h1>
          <p className="mt-2 text-body text-muted">
            Your cart is empty right now.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow"
          >
            Browse rings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-width py-8 md:py-12">
      <h1 className="font-sans text-heading-lg text-primary">Checkout</h1>
      <p className="mt-1 text-body text-muted">
        {prefill
          ? "Checking out with your account details — edit anything that's changed."
          : "Guest checkout — no account needed."}
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-12"
      >
        {/* Left — contact + delivery */}
        <div className="space-y-6">
          <fieldset className="rounded-md bg-card p-6 shadow-card">
            <legend className="px-1 font-sans text-subheading text-primary">
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
                  className="mt-1.5 h-12 w-full rounded-pill border border-border-subtle bg-card px-4 text-body text-primary"
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
                  className="mt-1.5 h-12 w-full rounded-pill border border-border-subtle bg-card px-4 text-body text-primary"
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
                  className="mt-1.5 h-12 w-full rounded-pill border border-border-subtle bg-card px-4 text-body text-primary"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-body font-medium">
                  Delivery notes <span className="text-muted">(optional)</span>
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border-subtle bg-card p-4 text-body text-primary"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-md bg-card p-6 shadow-card">
            <legend className="px-1 font-sans text-subheading text-primary">
              Delivery
            </legend>
            <label className="mt-4 block">
              <span className="text-body font-medium">Delivery location</span>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-pill border border-border-subtle bg-card px-4 text-body text-primary"
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
              <p className="mt-2 text-body text-danger">
                {locationsError}
              </p>
            ) : null}

            {totals && totals.shipments.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {totals.shipments.map((s) => (
                  <li
                    key={s.kind}
                    className="flex items-start justify-between gap-4 border-t border-border-subtle pt-3 first:border-t-0 first:pt-0"
                  >
                    <div>
                      <p className="text-body font-medium">
                        {s.kind === "in_stock" ? "In-stock rings" : "Pre-order rings"}
                      </p>
                      <p className="text-body text-muted">
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
              <p className="mt-3 text-body text-muted">
                {location
                  ? "Delivery fee is included below."
                  : "Choose your location to see delivery time and fees."}
              </p>
            )}
          </fieldset>
        </div>

        {/* Right — summary */}
        <aside className="space-y-4 rounded-md bg-card p-6 shadow-card lg:sticky lg:top-28">
          <h2 className="font-sans text-subheading text-primary">Order summary</h2>
          <ul className="space-y-2 text-body">
            {items.map((i) => (
              <li
                key={`${i.productId}:${i.sizeLabel}`}
                className="flex items-start justify-between gap-4"
              >
                <span className="min-w-0 text-muted">
                  {i.name}{" "}
                  <span className="text-primary">· Size {i.sizeLabel}</span> ×{" "}
                  {i.quantity}
                  <span className="mt-1 block">
                    <SaveForLaterButton
                      productId={i.productId}
                      sizeLabel={i.sizeLabel}
                    />
                  </span>
                </span>
                <span className="shrink-0 font-medium">
                  <Price amount={i.unitPriceBase * i.quantity} />
                </span>
              </li>
            ))}
          </ul>

          {totals ? (
            <dl className="space-y-2 border-t border-border-subtle pt-4 text-body">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium">
                  <Price amount={fromMinor(totals.subtotalMinor)} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="font-medium">
                  {totals.deliveryTotalMinor === 0 ? (
                    "Free"
                  ) : (
                    <Price amount={fromMinor(totals.deliveryTotalMinor)} />
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border-subtle pt-2 text-body-lg">
                <dt className="font-medium">Total</dt>
                <dd className="font-semibold">
                  <Price amount={fromMinor(totals.totalMinor)} />
                </dd>
              </div>
              {totals.amountDueLaterMinor > 0 ? (
                <>
                  <div className="flex justify-between pt-1 text-accent-strong">
                    <dt>Due now</dt>
                    <dd className="font-semibold">
                      <Price amount={fromMinor(totals.amountDueNowMinor)} />
                    </dd>
                  </div>
                  <div className="flex justify-between text-muted">
                    <dt>Due before shipping</dt>
                    <dd className="font-medium">
                      <Price amount={fromMinor(totals.amountDueLaterMinor)} />
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          ) : (
            <p className="border-t border-border-subtle pt-4 text-body text-muted">
              Total shown once you choose a location.
            </p>
          )}

          <fieldset className="rounded-md bg-card p-6 shadow-card">
            <legend className="px-1 font-sans text-subheading text-primary">
              Payment
            </legend>

            {options?.allowCurrencyChoice ? (
              <fieldset className="mt-4 rounded-md border border-border-subtle p-4">
                <legend className="px-1 text-label text-muted">
                  Charge currency
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(["USD", "NGN"] as const).map((option) => (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                        options.chargeCurrency === option
                          ? "border-accent bg-accent-wash/40"
                          : "border-border-subtle bg-card hover:border-muted"
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
                      <span className="text-body font-medium text-primary">
                        {option === "USD" ? "USD — dollars" : "NGN — naira"}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {options?.chargeCurrency === "NGN" && currency === "USD" ? (
              <p className="mt-4 text-body text-muted">
                {nairaDueNow !== null
                  ? `You’ll be charged ${formatPrice(nairaDueNow, "NGN")} now — the naira equivalent at the rate locked on your order.`
                  : "You’ll be charged in naira at the rate locked on your order."}
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              {loadingPayments ? (
                <p className="text-body text-muted">Loading payment methods…</p>
              ) : null}
              {paymentsError ? (
                <p role="alert" className="text-body text-danger">
                  {paymentsError}
                </p>
              ) : null}
              {options?.gateways.map((g) => (
                <label
                  key={g.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 transition-colors ${
                    gateway === g.id
                      ? "border-accent bg-accent-wash/40"
                      : "border-border-subtle bg-card hover:border-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="gateway"
                    value={g.id}
                    checked={gateway === g.id}
                    onChange={() => setGateway(g.id)}
                    className="size-4 accent-accent"
                  />
                  <span className="text-body font-medium text-primary">
                    {g.id === "paystack" ? "Paystack" : "BACHS"}
                  </span>
                </label>
              ))}
              {!loadingPayments &&
              !paymentsError &&
              options?.gateways.length === 0 ? (
                <p className="text-body text-muted">
                  No payment methods are available right now.{" "}
                  <Link href="/contact" className="underline">
                    Contact us
                  </Link>{" "}
                  to complete your order.
                </p>
              ) : null}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={
              submitting ||
              !location ||
              items.length === 0 ||
              !gateway ||
              !options
            }
            className="inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow disabled:bg-border-default disabled:text-muted disabled:shadow-none"
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>

          {error ? (
            <p role="alert" className="text-body text-danger">
              {error}
            </p>
          ) : null}

          <p className="text-body text-muted">
            You&apos;ll be redirected to a secure payment page to complete your
            purchase.
          </p>
        </aside>
      </form>
    </div>
  );
}
