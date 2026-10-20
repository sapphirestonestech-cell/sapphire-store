"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Reconcile a stuck payment with the gateway (§6.8, §10.7). The order only
 * becomes Paid on an exact amount + currency match.
 */
export function VerifyPaymentButton({ reference }: { reference: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  async function verify() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/payments/${encodeURIComponent(reference)}/verify`,
        { method: "POST" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        verified?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setMessage({
          kind: "error",
          text: data.error ?? "We couldn’t verify the payment.",
        });
        return;
      }
      setMessage({
        kind: data.verified ? "ok" : "error",
        text: data.message ?? "Verification finished.",
      });
      router.refresh();
    } catch {
      setMessage({
        kind: "error",
        text: "Check your connection and try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={verify}
        disabled={busy}
        className="inline-flex min-h-11 items-center rounded-pill bg-accent px-5 text-body font-medium text-primary shadow-gold-glow disabled:bg-border-default disabled:text-muted disabled:shadow-none"
      >
        {busy ? "Verifying…" : "Verify with gateway"}
      </button>
      <p
        aria-live="polite"
        className={`text-body ${
          message?.kind === "error"
            ? "text-danger"
            : "text-success"
        }`}
      >
        {message?.text ?? ""}
      </p>
    </div>
  );
}
