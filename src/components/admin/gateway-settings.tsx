"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { GatewayFlags } from "@/lib/payments/gateways";
import type {
  GatewayKeysStatus,
  KeyStatus,
  PaymentMode,
} from "@/lib/payments/keys";

function Switch({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-pill transition-colors duration-fast ${
        checked ? "bg-accent" : "bg-border-default"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 size-5 rounded-pill bg-card shadow-soft transition-transform duration-fast ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function ModeChoice({
  label,
  mode,
  status,
  onChange,
}: {
  label: string;
  mode: PaymentMode;
  status: Record<PaymentMode, KeyStatus>;
  onChange: (next: PaymentMode) => void;
}) {
  const current = status[mode];
  return (
    <div className="mt-3">
      <p className="text-label text-muted">Mode</p>
      <div
        role="radiogroup"
        aria-label={`${label} mode`}
        className="mt-1 inline-flex rounded-sm border border-border-subtle bg-app p-0.5"
      >
        {(["test", "live"] as const).map((option) => {
          const active = option === mode;
          const available = status[option].configured;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!available}
              onClick={() => onChange(option)}
              className={`inline-flex min-h-8 items-center rounded-sm px-3 text-label font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "bg-accent text-primary"
                  : "text-muted hover:text-primary"
              }`}
            >
              {option === "test" ? "Test" : "Live"}
            </button>
          );
        })}
      </div>
      <p
        className={`mt-1 text-label ${
          current.configured ? "text-muted" : "text-warning"
        }`}
        aria-live="polite"
      >
        {current.configured
          ? `${mode === "test" ? "Test" : "Live"} key is configured.`
          : current.reason}
      </p>
    </div>
  );
}

/**
 * Independent gateway switches and per-gateway test/live mode — ProductReq.md
 * §6.9 / §10.2, DECISIONS 2026-10-18, 2026-10-21 and 2026-10-29. A disabled
 * gateway disappears from checkout. "Allow customers to pay in USD" only
 * offers USD when the store is priced in USD and BACHS is available; every
 * other charge is NGN at the order's frozen rate. Keys are never entered
 * here: each mode reads its secret from the server environment, and a mode
 * with no key cannot be used.
 */
export function GatewaySettings({
  initial,
  keys,
  baseCurrency,
}: {
  initial: GatewayFlags;
  keys: GatewayKeysStatus;
  baseCurrency: "USD" | "NGN";
}) {
  const router = useRouter();
  const [flags, setFlags] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/payments/gateways", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flags),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({
          kind: "error",
          text: data.error ?? "That didn’t save. Try again.",
        });
        return;
      }
      setMessage({ kind: "ok", text: "Gateway settings saved." });
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
    <section className="max-w-2xl rounded-md bg-card p-6 shadow-card">
      <h2 className="font-sans text-subheading">Payment gateways</h2>
      <p className="mt-1 text-body text-muted">
        Each switch controls whether customers see that gateway at checkout.
        Turn one off and it disappears immediately. A gateway also needs a key
        for its selected mode, and must support the currency being charged.
      </p>

      <ul className="mt-4 divide-y divide-border-subtle">
        <li className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0">
            <p id="paystack-label" className="text-body font-medium">
              Paystack
            </p>
            <p className="text-label text-muted">
              Cards and local payments. NGN only.{" "}
              <span aria-live="polite">
                {flags.paystack ? "Visible at checkout." : "Hidden from checkout."}
              </span>
            </p>
            <ModeChoice
              label="Paystack"
              mode={flags.paystackMode}
              status={keys.paystack}
              onChange={(next) =>
                setFlags((f) => ({ ...f, paystackMode: next }))
              }
            />
          </div>
          <Switch
            id="paystack"
            label="Enable Paystack"
            checked={flags.paystack}
            onChange={(next) => setFlags((f) => ({ ...f, paystack: next }))}
          />
        </li>
        <li className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0">
            <p id="bachs-label" className="text-body font-medium">
              BACHS
            </p>
            <p className="text-label text-muted">
              International checkout. USD and NGN.{" "}
              <span aria-live="polite">
                {flags.bachs ? "Visible at checkout." : "Hidden from checkout."}
              </span>
            </p>
            <ModeChoice
              label="BACHS"
              mode={flags.bachsMode}
              status={keys.bachs}
              onChange={(next) =>
                setFlags((f) => ({ ...f, bachsMode: next }))
              }
            />
          </div>
          <Switch
            id="bachs"
            label="Enable BACHS"
            checked={flags.bachs}
            onChange={(next) => setFlags((f) => ({ ...f, bachs: next }))}
          />
        </li>
        <li className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0">
            <p id="allow-usd-label" className="text-body font-medium">
              Allow customers to pay in USD
            </p>
            <p className="text-label text-muted">
              When the store is priced in USD and a shopper is viewing USD, they
              can choose USD or NGN at checkout. USD payments go through BACHS;
              Paystack is naira-only. When off, every charge is in naira at the
              order&apos;s locked rate.
            </p>
            {baseCurrency !== "USD" ? (
              <p className="mt-1 text-label text-warning">
                Only takes effect when the base currency is USD (Currency tab).
              </p>
            ) : !flags.bachs ? (
              <p className="mt-1 text-label text-warning">
                Turn BACHS on to offer USD payments.
              </p>
            ) : null}
          </div>
          <Switch
            id="allow-usd"
            label="Allow customers to pay in USD"
            checked={flags.allowUsdCheckout}
            onChange={(next) =>
              setFlags((f) => ({ ...f, allowUsdCheckout: next }))
            }
          />
        </li>
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex min-h-11 items-center rounded-pill border border-border-subtle px-5 text-body font-medium disabled:bg-border-default disabled:text-muted"
        >
          {busy ? "Saving…" : "Save gateways"}
        </button>
        <span
          aria-live="polite"
          className={`text-body ${
            message?.kind === "error" ? "text-danger" : "text-success"
          }`}
        >
          {message?.text ?? ""}
        </span>
      </div>
    </section>
  );
}
