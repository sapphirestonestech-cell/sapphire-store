"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface DeliveryRow {
  id: string;
  country: string;
  region: string;
  cityArea: string;
  instockFee: number;
  preorderFee: number;
  minDays: number;
  maxDays: number;
  isActive: boolean;
}

interface FormState {
  country: string;
  region: string;
  cityArea: string;
  instockFee: string;
  preorderFee: string;
  minDays: string;
  maxDays: string;
}

const BLANK: FormState = {
  country: "",
  region: "",
  cityArea: "",
  instockFee: "",
  preorderFee: "",
  minDays: "",
  maxDays: "",
};

function toForm(row: DeliveryRow): FormState {
  return {
    country: row.country,
    region: row.region,
    cityArea: row.cityArea,
    instockFee: String(row.instockFee),
    preorderFee: String(row.preorderFee),
    minDays: String(row.minDays),
    maxDays: String(row.maxDays),
  };
}

/** Delivery locations CRUD — ProductReq.md §9. Fees are in the base currency. */
export function DeliveryManager({ initial }: { initial: DeliveryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [form, setForm] = useState<FormState>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function reload() {
    try {
      const res = await fetch("/api/admin/delivery");
      const data = (await res.json()) as { locations?: DeliveryRow[] };
      if (data.locations) setRows(data.locations);
    } catch {
      /* next full load will refresh */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      country: form.country,
      region: form.region,
      cityArea: form.cityArea,
      instockFee: Number(form.instockFee),
      preorderFee: Number(form.preorderFee),
      minDays: Number(form.minDays),
      maxDays: Number(form.maxDays),
    };
    try {
      const res = await fetch(
        editingId ? `/api/admin/delivery/${editingId}` : "/api/admin/delivery",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setForm(BLANK);
      setEditingId(null);
      await reload();
      router.refresh();
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(row: DeliveryRow) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/delivery/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      if (res.ok) {
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, isActive: !r.isActive } : r)),
        );
      } else {
        setError("Couldn't update the location.");
      }
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: DeliveryRow) {
    if (!window.confirm(`Delete ${row.cityArea}, ${row.country}?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/delivery/${row.id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      } else {
        setError("Couldn't remove the location.");
      }
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="rounded-card bg-pure-white p-6 shadow-card"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-subheading">
            {editingId ? "Edit location" : "Add a location"}
          </h2>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(BLANK);
              }}
              className="text-body text-soft-taupe hover:text-warm-ink"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Country" value={form.country} onChange={(v) => set("country", v)} required />
          <Field label="Region / state (optional)" value={form.region} onChange={(v) => set("region", v)} />
          <Field label="City or area" value={form.cityArea} onChange={(v) => set("cityArea", v)} required />
          <Field label="In-stock fee" type="number" value={form.instockFee} onChange={(v) => set("instockFee", v)} required />
          <Field label="Pre-order fee" type="number" value={form.preorderFee} onChange={(v) => set("preorderFee", v)} required />
          <Field label="Min days" type="number" value={form.minDays} onChange={(v) => set("minDays", v)} required />
          <Field label="Max days" type="number" value={form.maxDays} onChange={(v) => set("maxDays", v)} required />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-6 text-body-lg font-medium text-warm-ink shadow-gold-glow disabled:bg-pale-sand disabled:text-soft-taupe disabled:shadow-none"
        >
          {busy ? "Saving…" : editingId ? "Save changes" : "Add location"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-body text-status-error">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-card bg-pure-white p-10 text-center shadow-card">
          <p className="text-subheading">No delivery locations yet</p>
          <p className="mx-auto mt-2 max-w-md text-body text-soft-taupe">
            Add the places you deliver to, with their fees and delivery days.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-4 rounded-card bg-pure-white p-4 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body-lg font-medium">
                  {row.cityArea}
                  {row.region ? `, ${row.region}` : ""}, {row.country}
                </p>
                <p className="text-label text-soft-taupe">
                  In-stock {row.instockFee} · Pre-order {row.preorderFee} ·{" "}
                  {row.minDays}–{row.maxDays} days ·{" "}
                  {row.isActive ? "Visible" : "Hidden"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingId(row.id);
                  setForm(toForm(row));
                }}
                disabled={busy}
                className="inline-flex min-h-10 items-center rounded-pill border border-hairline bg-pure-white px-4 text-label font-medium disabled:bg-pale-sand"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => toggleActive(row)}
                disabled={busy}
                className="inline-flex min-h-10 items-center rounded-pill border border-hairline bg-pure-white px-4 text-label font-medium disabled:bg-pale-sand"
              >
                {row.isActive ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => remove(row)}
                disabled={busy}
                className="inline-flex min-h-10 items-center rounded-pill px-4 text-label font-medium text-status-error disabled:text-soft-taupe"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-body font-medium">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        min={type === "number" ? 0 : undefined}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg"
      />
    </label>
  );
}
