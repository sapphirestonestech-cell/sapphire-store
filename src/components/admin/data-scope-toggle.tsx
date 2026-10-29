"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DataScope } from "@/lib/admin/data-scope";

const OPTIONS: { value: DataScope; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "test", label: "Test" },
];

/**
 * Switches the back office between live and test order data. This is separate
 * from the gateway mode: a test payment stays visible here after the gateway
 * has been switched back to live (DECISIONS 2026-10-29).
 */
export function DataScopeToggle({ scope }: { scope: DataScope }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(next: DataScope) {
    if (next === scope || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: next }),
      });
      if (!res.ok) {
        setError("Couldn’t switch data. Try again.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {scope === "test" ? (
        <span className="inline-flex items-center rounded-pill border border-warning/40 bg-warning/10 px-3 py-1 text-label font-medium text-warning">
          Test data
        </span>
      ) : null}
      <div
        role="group"
        aria-label="Order data"
        className="inline-flex rounded-sm border border-border-subtle bg-card p-1 shadow-soft"
      >
        {OPTIONS.map((option) => {
          const active = option.value === scope;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              disabled={busy}
              onClick={() => choose(option.value)}
              className={`inline-flex min-h-9 items-center rounded-sm px-4 text-label font-medium transition-colors disabled:opacity-60 ${
                active
                  ? "bg-accent text-primary"
                  : "text-muted hover:text-primary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span aria-live="polite" className="text-label text-danger">
        {error ?? ""}
      </span>
    </div>
  );
}
