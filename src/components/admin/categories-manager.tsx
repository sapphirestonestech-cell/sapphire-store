"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
}

/** Category CRUD — ProductReq.md §6.4. Deleting a category never deletes
 *  products; the server unassigns them (§17). */
export function CategoriesManager({ initial }: { initial: CategoryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(
    url: string,
    method: string,
    body?: unknown,
  ): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Something went wrong. Try again.");
        return false;
      }
      return true;
    } catch {
      setError("Check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const ok = await call("/api/admin/categories", "POST", { name });
    if (ok) {
      setNewName("");
      router.refresh();
      try {
        const res = await fetch("/api/admin/categories");
        const data = (await res.json()) as { categories?: CategoryRow[] };
        if (data.categories) setRows(data.categories);
      } catch {
        /* refresh on next load */
      }
    }
  }

  async function rename(row: CategoryRow) {
    const name = window.prompt("Rename category", row.name);
    if (!name || name.trim() === row.name) return;
    const ok = await call(`/api/admin/categories/${row.id}`, "PATCH", {
      name: name.trim(),
    });
    if (ok) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, name: name.trim() } : r)),
      );
    }
  }

  async function toggleActive(row: CategoryRow) {
    const ok = await call(`/api/admin/categories/${row.id}`, "PATCH", {
      isActive: !row.isActive,
    });
    if (ok) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, isActive: !r.isActive } : r,
        ),
      );
    }
  }

  async function remove(row: CategoryRow) {
    const message =
      row.productCount > 0
        ? `Delete “${row.name}”? Its ${row.productCount} product(s) will stay in your store and simply lose this category.`
        : `Delete “${row.name}”?`;
    if (!window.confirm(message)) return;
    const ok = await call(`/api/admin/categories/${row.id}`, "DELETE");
    if (ok) setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={createCategory}
        className="flex flex-wrap gap-3 rounded-card bg-pure-white p-6 shadow-card"
      >
        <div className="min-w-56 flex-1 space-y-1.5">
          <label htmlFor="new-category" className="text-body font-medium">
            New category
          </label>
          <input
            id="new-category"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Anniversary"
            className="h-12 w-full rounded-pill border border-hairline bg-pure-white px-5 text-body-lg"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="mt-0 inline-flex min-h-12 items-center self-end rounded-pill bg-champagne-gold px-6 text-body-lg font-medium text-warm-ink shadow-gold-glow disabled:bg-pale-sand disabled:text-soft-taupe disabled:shadow-none"
        >
          {busy ? "Working…" : "Create category"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-body text-status-error">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-card bg-pure-white p-10 text-center shadow-card">
          <p className="text-subheading">No categories yet</p>
          <p className="mx-auto mt-2 max-w-md text-body text-soft-taupe">
            Create one above, then assign rings to it.
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
                <p className="text-body-lg font-medium">{row.name}</p>
                <p className="text-label text-soft-taupe">
                  {row.productCount}{" "}
                  {row.productCount === 1 ? "product" : "products"} ·{" "}
                  {row.isActive ? "Visible" : "Hidden"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => rename(row)}
                disabled={busy}
                className="inline-flex min-h-10 items-center rounded-pill border border-hairline bg-pure-white px-4 text-label font-medium disabled:bg-pale-sand"
              >
                Rename
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
