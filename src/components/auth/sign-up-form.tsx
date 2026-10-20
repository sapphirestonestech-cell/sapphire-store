"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function SignUpForm({
  googleEnabled,
  callbackUrl = "/account",
}: {
  googleEnabled: boolean;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "We couldn't create your account. Try again.");
        return;
      }
      // Sign the new customer in immediately.
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (!signInRes || signInRes.error) {
        // Account exists; send them to sign in instead of failing hard.
        router.push(`/sign-in${callbackUrl !== "/account" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
        router.refresh();
        return;
      }
      router.push(signInRes.url ?? callbackUrl);
      router.refresh();
    } catch {
      setError("We couldn't create your account. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {googleEnabled ? (
        <>
          <GoogleSignInButton callbackUrl={callbackUrl} />
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="text-label text-muted">or</span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>
        </>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-body font-medium">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 w-full rounded-pill border border-border-subtle bg-card px-5 text-body-lg text-primary"
          />
        </div>
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
            className="h-12 w-full rounded-pill border border-border-subtle bg-card px-5 text-body-lg text-primary placeholder:text-muted"
            placeholder="you@example.com"
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
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-pill border border-border-subtle bg-card px-5 text-body-lg text-primary"
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-body text-muted">
            At least 8 characters.
          </p>
        </div>

        {error ? (
          <p role="alert" className="text-body text-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow disabled:bg-border-default disabled:text-muted disabled:shadow-none"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-body text-muted">
        Already have an account?{" "}
        <Link
          href={`/sign-in${callbackUrl !== "/account" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-primary underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
