"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function SignInForm({
  googleEnabled,
  callbackUrl = "/account",
}: {
  googleEnabled: boolean;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (!res || res.error) {
      if (res?.error === "CredentialsSignin") {
        setError("Email or password is incorrect.");
      } else if (res?.error === "AccessDenied") {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else {
        setError("Sign-in failed. Try again shortly.");
      }
      return;
    }
    router.push(res.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {googleEnabled ? (
        <>
          <GoogleSignInButton callbackUrl={callbackUrl} />
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
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-body font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-body text-soft-taupe underline-offset-4 hover:text-warm-ink hover:underline"
            >
              Forgot password?
            </Link>
          </div>
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

      <p className="text-center text-body text-soft-taupe">
        New to Sapphire?{" "}
        <Link
          href={`/sign-up${callbackUrl !== "/account" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-warm-ink underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
