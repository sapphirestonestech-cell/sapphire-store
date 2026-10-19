"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Currency } from "@/lib/currency";

interface ProfileInitial {
  name: string;
  email: string;
  phone: string;
  preferredCurrency: Currency;
}

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>(
    initial.preferredCurrency,
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, preferredCurrency }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "We couldn't save your changes. Try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("We couldn't save your changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-card bg-pure-white p-6 shadow-card">
      <div className="space-y-1.5">
        <label htmlFor="profile-name" className="text-body font-medium">
          Full name
        </label>
        <input
          id="profile-name"
          type="text"
          required
          minLength={2}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg text-warm-ink"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="profile-email" className="text-body font-medium">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={initial.email}
          readOnly
          disabled
          className="h-12 w-full rounded-pill border border-hairline bg-pale-sand px-5 text-body-lg text-soft-taupe"
          aria-describedby="profile-email-hint"
        />
        <p id="profile-email-hint" className="text-body text-soft-taupe">
          Your sign-in email can&apos;t be changed here.
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="profile-phone" className="text-body font-medium">
          Phone <span className="text-soft-taupe">(optional)</span>
        </label>
        <input
          id="profile-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg text-warm-ink"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="profile-currency" className="text-body font-medium">
          Display currency
        </label>
        <select
          id="profile-currency"
          value={preferredCurrency}
          onChange={(e) => setPreferredCurrency(e.target.value as Currency)}
          className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-4 text-body text-warm-ink"
        >
          <option value="USD">USD — US Dollar</option>
          <option value="NGN">NGN — Nigerian Naira</option>
        </select>
        <p className="text-body text-soft-taupe">
          Used as your default when signing in on a new device. The header
          switcher still overrides it on any visit.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-body text-status-error">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="text-body text-status-success">
          Changes saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow disabled:bg-pale-sand disabled:text-soft-taupe disabled:shadow-none"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
