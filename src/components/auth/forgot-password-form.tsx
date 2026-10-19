"use client";

import { useState, type FormEvent } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "We couldn't send the reset email. Try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("We couldn't send the reset email. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-body-lg text-warm-ink">Check your inbox</p>
        <p className="text-body text-soft-taupe">
          If an account exists for <span className="text-warm-ink">{email}</span>,
          we&apos;ve sent a link to reset the password. The link works once and
          expires in one hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-body font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg text-warm-ink placeholder:text-soft-taupe"
          placeholder="you@example.com"
        />
      </div>

      {error ? (
        <p role="alert" className="text-body text-status-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow disabled:bg-pale-sand disabled:text-soft-taupe disabled:shadow-none"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
