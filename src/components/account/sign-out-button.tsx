"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signOut({ callbackUrl: "/" }).finally(() => {
          router.refresh();
        });
      }}
      className={`inline-flex min-h-11 items-center rounded-pill border border-border-subtle bg-card px-5 text-body text-primary hover:bg-accent-wash disabled:opacity-60 ${className ?? ""}`}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
