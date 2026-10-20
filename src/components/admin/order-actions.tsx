"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/models/order";

interface Props {
  orderId: string;
  status: OrderStatus;
  nextStatuses: OrderStatus[];
  canCancel: boolean;
  canRefund: boolean;
  canVerify: boolean;
  paymentReference?: string;
  adminNotes: string;
}

/**
 * Admin order actions — ProductReq.md §6.7. An order only becomes Paid by
 * verifying with the gateway, so "Paid" is never offered as a manual status.
 */
export function OrderActions({
  orderId,
  status,
  nextStatuses,
  canCancel,
  canRefund,
  canVerify,
  paymentReference,
  adminNotes,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );

  const [next, setNext] = useState<OrderStatus | "">(nextStatuses[0] ?? "");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(adminNotes);

  async function patch(body: Record<string, unknown>, busyKey: string) {
    setBusy(busyKey);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({
          kind: "error",
          text: data.error ?? "That change didn’t save. Try again.",
        });
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setMessage({
        kind: "error",
        text: "Check your connection and try again.",
      });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function saveStatus() {
    if (!next) return;
    const ok = await patch({
      action: "status",
      status: next,
      note: note.trim() || undefined,
    }, "status");
    if (ok) {
      setMessage({
        kind: "ok",
        text: `Status updated to ${ORDER_STATUS_LABELS[next]}.`,
      });
      setNote("");
    }
  }

  async function cancel() {
    if (
      !window.confirm(
        "Cancel this order? This cannot be undone. Refunds are handled separately.",
      )
    ) {
      return;
    }
    const ok = await patch({ action: "cancel", note: note.trim() || undefined }, "cancel");
    if (ok) setMessage({ kind: "ok", text: "Order cancelled." });
  }

  async function refund() {
    if (
      !window.confirm(
        "Mark this order refunded? Only do this after refunding through the gateway dashboard.",
      )
    ) {
      return;
    }
    const ok = await patch({ action: "refund", note: note.trim() || undefined }, "refund");
    if (ok) setMessage({ kind: "ok", text: "Order marked refunded." });
  }

  async function saveNotes() {
    const ok = await patch({ action: "notes", notes }, "notes");
    if (ok) setMessage({ kind: "ok", text: "Notes saved." });
  }

  async function verify() {
    if (!paymentReference) return;
    setBusy("verify");
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/payments/${encodeURIComponent(paymentReference)}/verify`,
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
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6 rounded-md bg-card p-6 shadow-card">
      <div>
        <h2 className="font-sans text-subheading">Manage order</h2>
        <p className="mt-1 text-body text-muted">
          Payment is confirmed by the gateway, not set by hand.
        </p>
      </div>

      {canVerify && paymentReference ? (
        <div className="rounded-sm border border-border-subtle p-4">
          <p className="text-body font-medium">Payment not confirmed</p>
          <p className="mt-1 text-label text-muted">
            Reference {paymentReference}
          </p>
          <button
            type="button"
            onClick={verify}
            disabled={busy !== null}
            className="mt-3 inline-flex min-h-11 items-center rounded-pill border border-border-subtle px-5 text-body font-medium disabled:bg-border-default disabled:text-muted"
          >
            {busy === "verify" ? "Verifying…" : "Verify with gateway"}
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-body font-medium">Next status</span>
          {nextStatuses.length > 0 ? (
            <select
              value={next}
              onChange={(e) => setNext(e.target.value as OrderStatus)}
              className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
            >
              {nextStatuses.map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-body text-muted">
              No further status changes are available for this order.
            </p>
          )}
        </label>

        <label className="block space-y-1.5">
          <span className="text-body font-medium">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="Added to the status timeline"
            className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
          />
        </label>

        {nextStatuses.length > 0 ? (
          <button
            type="button"
            onClick={saveStatus}
            disabled={busy !== null}
            className="inline-flex min-h-12 items-center rounded-pill bg-accent px-6 text-body-lg font-medium text-primary shadow-gold-glow disabled:bg-border-default disabled:text-muted disabled:shadow-none"
          >
            {busy === "status" ? "Saving…" : "Save status"}
          </button>
        ) : null}
      </div>

      <div className="border-t border-border-subtle pt-5">
        <label className="block space-y-1.5">
          <span className="text-body font-medium">Internal notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Only you can see this"
            className="w-full rounded-sm border border-border-subtle bg-card px-4 py-3 text-body"
          />
        </label>
        <button
          type="button"
          onClick={saveNotes}
          disabled={busy !== null}
          className="mt-3 inline-flex min-h-11 items-center rounded-pill border border-border-subtle px-5 text-body font-medium disabled:bg-border-default disabled:text-muted"
        >
          {busy === "notes" ? "Saving…" : "Save notes"}
        </button>
      </div>

      {canCancel || canRefund ? (
        <div className="space-y-3 border-t border-border-subtle pt-5">
          <p className="text-body font-medium">Destructive actions</p>
          <div className="flex flex-wrap gap-3">
            {canCancel ? (
              <button
                type="button"
                onClick={cancel}
                disabled={busy !== null}
                className="inline-flex min-h-11 items-center rounded-pill border border-danger px-5 text-body font-medium text-danger disabled:border-border-default disabled:text-muted"
              >
                {busy === "cancel" ? "Cancelling…" : "Cancel order"}
              </button>
            ) : null}
            {canRefund ? (
              <button
                type="button"
                onClick={refund}
                disabled={busy !== null}
                className="inline-flex min-h-11 items-center rounded-pill border border-danger px-5 text-body font-medium text-danger disabled:border-border-default disabled:text-muted"
              >
                {busy === "refund" ? "Saving…" : "Mark refunded"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

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
      <p className="text-label text-muted">
        Current status: {ORDER_STATUS_LABELS[status]}
      </p>
    </div>
  );
}
