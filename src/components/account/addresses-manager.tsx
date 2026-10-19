"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export interface AddressView {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  locationId: string;
  phone?: string;
  isDefault: boolean;
}

interface LocationOption {
  id: string;
  label: string;
}

interface FormState {
  id?: string;
  label: string;
  line1: string;
  line2: string;
  locationId: string;
  phone: string;
  isDefault: boolean;
}

const EMPTY: FormState = {
  label: "",
  line1: "",
  line2: "",
  locationId: "",
  phone: "",
  isDefault: false,
};

export function AddressesManager({
  initialAddresses,
  locations,
}: {
  initialAddresses: AddressView[];
  locations: LocationOption[];
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    setBusy(true);
    try {
      const isUpdate = Boolean(editing.id);
      const res = await fetch(
        isUpdate ? `/api/account/addresses/${editing.id}` : "/api/account/addresses",
        {
          method: isUpdate ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing),
        },
      );
      const data = (await res.json()) as {
        error?: string;
        address?: AddressView;
      };
      if (!res.ok || !data.address) {
        setError(data.error ?? "We couldn't save this address. Try again.");
        return;
      }
      // Refetch so default-flag changes on other rows are reflected.
      const listRes = await fetch("/api/account/addresses");
      const listData = (await listRes.json()) as { addresses?: AddressView[] };
      if (listData.addresses) setAddresses(listData.addresses);
      setEditing(null);
      router.refresh();
    } catch {
      setError("We couldn't save this address. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "We couldn't delete this address.");
        return;
      }
      setAddresses((prev) => {
        const next = prev.filter((a) => a.id !== id);
        // Mirror the server's promote-another-default behaviour.
        if (prev.find((a) => a.id === id)?.isDefault && next.length > 0) {
          return next.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
        }
        return next;
      });
      router.refresh();
    } catch {
      setError("We couldn't delete this address. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function locationLabel(id: string): string {
    return locations.find((l) => l.id === id)?.label ?? "Delivery location";
  }

  return (
    <div className="space-y-6">
      {addresses.length === 0 && !editing ? (
        <div className="rounded-card bg-pure-white p-8 text-center shadow-card">
          <p className="text-body-lg text-warm-ink">No saved addresses</p>
          <p className="mt-2 text-body text-soft-taupe">
            Add the place you deliver to most and it&apos;s ready at checkout.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex flex-col rounded-card bg-pure-white p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-body-lg font-medium">{a.label}</p>
                {a.isDefault ? (
                  <span className="rounded-chip-label bg-gold-wash px-2 py-0.5 text-label font-medium text-deep-gold">
                    Default
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-body text-soft-taupe">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
              </p>
              <p className="text-body text-soft-taupe">{locationLabel(a.locationId)}</p>
              {a.phone ? (
                <p className="mt-1 text-body text-soft-taupe">{a.phone}</p>
              ) : null}
              <div className="mt-4 flex gap-2 border-t border-hairline pt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEditing({
                      id: a.id,
                      label: a.label,
                      line1: a.line1,
                      line2: a.line2 ?? "",
                      locationId: a.locationId,
                      phone: a.phone ?? "",
                      isDefault: a.isDefault,
                    });
                    setError(null);
                  }}
                  className="inline-flex min-h-11 items-center rounded-pill border border-hairline px-4 text-body hover:bg-gold-wash disabled:opacity-60"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(a.id)}
                  className="inline-flex min-h-11 items-center rounded-pill border border-hairline px-4 text-body text-status-error hover:bg-gold-wash disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <form
          onSubmit={save}
          className="max-w-lg space-y-5 rounded-card bg-pure-white p-6 shadow-card"
        >
          <h3 className="text-subheading font-semibold">
            {editing.id ? "Edit address" : "New address"}
          </h3>
          <div className="space-y-1.5">
            <label htmlFor="addr-label" className="text-body font-medium">
              Label
            </label>
            <input
              id="addr-label"
              required
              maxLength={40}
              value={editing.label}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="Home"
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg text-warm-ink"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="addr-line1" className="text-body font-medium">
              Street address
            </label>
            <input
              id="addr-line1"
              required
              minLength={3}
              value={editing.line1}
              onChange={(e) => setEditing({ ...editing, line1: e.target.value })}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg text-warm-ink"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="addr-line2" className="text-body font-medium">
              Apt, suite, landmark <span className="text-soft-taupe">(optional)</span>
            </label>
            <input
              id="addr-line2"
              value={editing.line2}
              onChange={(e) => setEditing({ ...editing, line2: e.target.value })}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg text-warm-ink"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="addr-location" className="text-body font-medium">
              Delivery location
            </label>
            <select
              id="addr-location"
              required
              value={editing.locationId}
              onChange={(e) => setEditing({ ...editing, locationId: e.target.value })}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-4 text-body text-warm-ink"
            >
              <option value="">
                {locations.length === 0 ? "No locations available" : "Choose a location"}
              </option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="addr-phone" className="text-body font-medium">
              Phone <span className="text-soft-taupe">(optional)</span>
            </label>
            <input
              id="addr-phone"
              type="tel"
              value={editing.phone}
              onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
              className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg text-warm-ink"
            />
          </div>
          <label className="flex min-h-11 items-center gap-3 text-body">
            <input
              type="checkbox"
              checked={editing.isDefault}
              onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
              className="size-5 accent-champagne-gold"
            />
            Set as my default address
          </label>

          {error ? (
            <p role="alert" className="text-body text-status-error">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow disabled:bg-pale-sand disabled:text-soft-taupe disabled:shadow-none"
            >
              {busy ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setEditing(null);
                setError(null);
              }}
              className="inline-flex min-h-12 items-center rounded-pill border border-hairline px-6 text-body text-warm-ink hover:bg-gold-wash disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditing({ ...EMPTY });
            setError(null);
          }}
          className="inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow"
        >
          Add address
        </button>
      )}

      {error && editing ? null : error ? (
        <p role="alert" className="text-body text-status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
