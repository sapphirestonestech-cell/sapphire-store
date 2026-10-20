"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export interface AdminRow {
  id: string;
  email: string;
  role: "admin" | "staff";
  lastLoginAt: string | null;
  createdAt: string | null;
}

function formatDay(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Admin accounts — add a full admin or remove one. The API enforces the two
 * safety rules: no self-removal and never remove the last admin.
 */
export function AdminsManager({
  initial,
  currentAdminId,
}: {
  initial: AdminRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addAdmin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        admin?: AdminRow;
        error?: string;
      };
      if (!res.ok || !data.admin) {
        setError(data.error ?? "The admin could not be added. Try again.");
        return;
      }
      setRows((prev) => [...prev, data.admin!]);
      setEmail("");
      setPassword("");
      router.refresh();
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAdmin(row: AdminRow) {
    if (
      !window.confirm(
        `Remove ${row.email}? They will lose back-office access immediately.`,
      )
    ) {
      return;
    }

    setRemovingId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/admins/${row.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "The admin could not be removed.");
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      router.refresh();
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={addAdmin}
        className="rounded-md bg-card p-6 shadow-card"
      >
        <h2 className="font-sans text-subheading">Add an admin</h2>
        <p className="mt-1 text-body text-muted">
          Share the email and password with them. They sign in at
          /admin/login and have full access to the back office.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-body font-medium">Email</span>
            <input
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-12 w-full rounded-pill border border-border-subtle bg-card px-5 text-body-lg"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-body font-medium">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-12 w-full rounded-pill border border-border-subtle bg-card px-5 text-body-lg"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex min-h-12 items-center rounded-pill bg-accent px-6 text-body-lg font-medium text-primary shadow-gold-glow disabled:bg-border-default disabled:text-muted disabled:shadow-none"
        >
          {busy ? "Adding…" : "Add admin"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="admin-list-heading">
        <h2 id="admin-list-heading" className="sr-only">
          Admin accounts
        </h2>
        <ul className="space-y-3">
          {rows.map((row) => {
            const lastLogin = formatDay(row.lastLoginAt);
            const added = formatDay(row.createdAt);
            const isCurrent = row.id === currentAdminId;
            const initial = row.email.charAt(0).toUpperCase();

            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-4 rounded-md bg-card p-4 shadow-card"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-accent-wash text-body-lg font-medium text-accent-strong ring-1 ring-border-subtle"
                >
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-body-lg font-medium break-all">
                    {row.email}
                    {isCurrent ? (
                      <span className="rounded-pill bg-accent-wash px-2.5 py-0.5 text-label font-medium text-accent-strong">
                        You
                      </span>
                    ) : null}
                  </p>
                  <p className="text-label text-muted">
                    Admin ·{" "}
                    {lastLogin ? `Last signed in ${lastLogin}` : "Never signed in"}
                    {added ? ` · Added ${added}` : ""}
                  </p>
                </div>
                {isCurrent ? (
                  <span className="text-label text-muted">
                    Can&apos;t remove yourself
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeAdmin(row)}
                    disabled={removingId !== null}
                    className="inline-flex min-h-10 items-center rounded-pill px-4 text-label font-medium text-danger disabled:text-muted"
                  >
                    {removingId === row.id ? "Removing…" : "Remove"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
