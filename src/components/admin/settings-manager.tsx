"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface SettingsState {
  baseCurrency: "USD" | "NGN";
  usdToNgn: number;
  usdDecimals: number;
  ngnNearest: number;
  tagline: string;
  storeName: string;
}

/**
 * Store settings — ProductReq.md §6.5, §12.1. Prices are entered once in
 * the base currency; the other currency is derived from the exchange rate.
 * Saving a new rate appends to history so past orders keep their rate.
 */
export function SettingsManager({ initial }: { initial: SettingsState }) {
  const router = useRouter();
  const [usdToNgn, setUsdToNgn] = useState(String(initial.usdToNgn));
  const [baseCurrency, setBaseCurrency] = useState(initial.baseCurrency);
  const [usdDecimals, setUsdDecimals] = useState(String(initial.usdDecimals));
  const [ngnNearest, setNgnNearest] = useState(String(initial.ngnNearest));
  const [tagline, setTagline] = useState(initial.tagline);
  const [storeName, setStoreName] = useState(initial.storeName);

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usdToNgn: Number(usdToNgn),
          baseCurrency,
          usdDecimals: Number(usdDecimals),
          ngnNearest: Number(ngnNearest),
          tagline,
          storeName,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <section className="rounded-card bg-pure-white p-6 shadow-card">
        <h2 className="font-display text-subheading">Currency &amp; exchange</h2>
        <p className="mt-1 text-body text-soft-taupe">
          Enter prices once in your base currency. The other currency is
          calculated from this rate.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-body font-medium">Base currency</span>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value as "USD" | "NGN")}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="NGN">NGN — Nigerian Naira</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-body font-medium">1 USD equals (NGN)</span>
            <input
              type="number"
              min={1}
              step="0.01"
              required
              value={usdToNgn}
              onChange={(e) => setUsdToNgn(e.target.value)}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-body font-medium">USD decimal places</span>
            <input
              type="number"
              min={0}
              max={4}
              required
              value={usdDecimals}
              onChange={(e) => setUsdDecimals(e.target.value)}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-body font-medium">Round NGN to nearest</span>
            <input
              type="number"
              min={0}
              required
              value={ngnNearest}
              onChange={(e) => setNgnNearest(e.target.value)}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg"
            />
          </label>
        </div>
      </section>

      <section className="rounded-card bg-pure-white p-6 shadow-card">
        <h2 className="font-display text-subheading">Store</h2>
        <div className="mt-4 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-body font-medium">Store name</span>
            <input
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-body font-medium">Tagline</span>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg"
            />
          </label>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-6 text-body-lg font-medium text-warm-ink shadow-gold-glow disabled:bg-pale-sand disabled:text-soft-taupe disabled:shadow-none"
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
        <span aria-live="polite" className="text-body text-status-success">
          {saved ? "Saved." : ""}
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-body text-status-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
