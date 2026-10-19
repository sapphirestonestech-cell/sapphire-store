"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function LoginForm({
  googleEnabled,
  initialError = null,
}: {
  googleEnabled: boolean;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Sign-in failed. Try again.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Sign-in failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {googleEnabled ? (
        <>
          <GoogleSignInButton callbackUrl="/api/admin/google-session" />
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-hairline" />
            <span className="text-label text-soft-taupe">or</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>
        </>
      ) : null}

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
            placeholder="you@store.com"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-body font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg text-warm-ink"
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
