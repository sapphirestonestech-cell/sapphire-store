"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Row actions for the products list: edit + confirmed delete (§6.3, §17). */
export function ProductActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    const ok = window.confirm(
      `Delete “${name}”? This cannot be undone.`,
    );
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "The ring could not be deleted.");
        return;
      }
      router.refresh();
    } catch {
      setError("The ring could not be deleted. Check your connection.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/products/${id}`}
        className="inline-flex min-h-10 items-center rounded-pill border border-border-subtle bg-card px-4 text-label font-medium"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={confirmDelete}
        disabled={deleting}
        className="inline-flex min-h-10 items-center rounded-pill px-4 text-label font-medium text-danger disabled:text-muted"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <span role="alert" className="text-label text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
