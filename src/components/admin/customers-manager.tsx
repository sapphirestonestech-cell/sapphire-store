"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string | null;
  lastLoginAt: string | null;
  orderCount: number;
  isAdmin: boolean;
}

function formatDay(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Storefront accounts and their back-office access — client decision
 * 2026-11-15. Granting reuses the customer's own login; revoking removes the
 * linked admin row and leaves the storefront account untouched.
 */
export function CustomersManager({
  initial,
  currentAdminEmail,
}: {
  initial: CustomerRow[];
  currentAdminEmail: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (row.phone ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  async function toggleAccess(row: CustomerRow) {
    const next = !row.isAdmin;
    if (
      !next &&
      !window.confirm(
        `Revoke back-office access for ${row.email}? They keep their storefront account and can still shop.`,
      )
    ) {
      return;
    }

    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/customers/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Access could not be updated. Try again.");
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, isAdmin: next } : r)),
      );
      setNotice(
        next
          ? `Back-office access granted to ${row.email}.`
          : `Back-office access revoked from ${row.email}.`,
      );
      router.refresh();
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-card p-4 shadow-card">
        <label className="block max-w-md space-y-1.5">
          <span className="text-label text-muted">Search customers</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email or phone"
            className="h-11 w-full rounded-pill border border-border-subtle bg-card px-4 text-body"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      ) : null}
      <p aria-live="polite" className="text-body text-success">
        {notice ?? ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-md bg-card p-10 text-center shadow-card">
          <p className="text-subheading">No customers match your search</p>
          <p className="mx-auto mt-2 max-w-md text-body text-muted">
            Clear the search to see every storefront account.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-5 inline-flex min-h-11 items-center rounded-pill border border-border-subtle px-5 text-body font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-sm bg-card shadow-card md:block">
            <table className="w-full min-w-[860px] text-left text-body">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border-subtle text-label text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-5 py-3 font-medium">Phone</th>
                  <th scope="col" className="px-5 py-3 font-medium">Joined</th>
                  <th scope="col" className="px-5 py-3 font-medium">Last signed in</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Orders</th>
                  <th scope="col" className="px-5 py-3 font-medium">Access</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isSelf =
                    row.email.trim().toLowerCase() ===
                    currentAdminEmail.trim().toLowerCase();
                  const busy = busyId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border-subtle last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{row.name}</p>
                          {isSelf ? (
                            <span className="rounded-pill bg-accent-wash px-2.5 py-0.5 text-label font-medium text-accent-strong">
                              You
                            </span>
                          ) : null}
                        </div>
                        <p className="text-label text-muted break-all">
                          {row.email}
                        </p>
                      </td>
                      <td className="px-5 py-4">{row.phone ?? "—"}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {formatDay(row.createdAt)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {row.lastLoginAt ? formatDay(row.lastLoginAt) : "Never"}
                      </td>
                      <td className="px-5 py-4 text-right tabular">
                        {row.orderCount}
                      </td>
                      <td className="px-5 py-4">
                        <AccessBadge isAdmin={row.isAdmin} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <AccessAction
                          row={row}
                          isSelf={isSelf}
                          busy={busy}
                          onToggle={() => toggleAccess(row)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {filtered.map((row) => {
              const isSelf =
                row.email.trim().toLowerCase() ===
                currentAdminEmail.trim().toLowerCase();
              const busy = busyId === row.id;

              return (
                <li
                  key={row.id}
                  className="rounded-md bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-body-lg font-medium">{row.name}</p>
                        {isSelf ? (
                          <span className="rounded-pill bg-accent-wash px-2.5 py-0.5 text-label font-medium text-accent-strong">
                            You
                          </span>
                        ) : null}
                      </div>
                      <p className="text-label text-muted break-all">
                        {row.email}
                      </p>
                      {row.phone ? (
                        <p className="text-label text-muted">{row.phone}</p>
                      ) : null}
                    </div>
                    <AccessBadge isAdmin={row.isAdmin} />
                  </div>

                  <p className="mt-3 text-label text-muted">
                    {row.orderCount} {row.orderCount === 1 ? "order" : "orders"} ·
                    Joined {formatDay(row.createdAt)}
                  </p>
                  <div className="mt-3">
                    <AccessAction
                      row={row}
                      isSelf={isSelf}
                      busy={busy}
                      onToggle={() => toggleAccess(row)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function AccessBadge({ isAdmin }: { isAdmin: boolean }) {
  return isAdmin ? (
    <span className="rounded-pill bg-accent-wash px-2.5 py-0.5 text-label font-medium text-accent-strong">
      Admin
    </span>
  ) : (
    <span className="rounded-pill border border-border-subtle px-2.5 py-0.5 text-label text-muted">
      Customer
    </span>
  );
}

function AccessAction({
  row,
  isSelf,
  busy,
  onToggle,
}: {
  row: CustomerRow;
  isSelf: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  if (isSelf && row.isAdmin) {
    return <span className="text-label text-muted">Your account</span>;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      className={[
        "inline-flex min-h-10 items-center rounded-pill px-4 text-label font-medium",
        row.isAdmin
          ? "text-danger disabled:text-muted"
          : "bg-accent text-primary shadow-gold-glow disabled:bg-border-default disabled:text-muted disabled:shadow-none",
      ].join(" ")}
    >
      {busy
        ? "Saving…"
        : row.isAdmin
          ? "Revoke access"
          : "Make admin"}
    </button>
  );
}
