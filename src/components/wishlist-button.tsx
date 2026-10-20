"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore, useState } from "react";
import {
  addItem,
  getServerSnapshot,
  getSnapshot,
  removeItem,
  subscribe,
  WISHLIST_MAX,
} from "@/lib/wishlist";
import { Toast } from "@/components/ui/toast";
import { useSignedIn } from "@/components/signed-in-provider";

function useIsWishlisted(productId: string): boolean {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return items.some((i) => i.productId === productId);
}

/**
 * Wishlist heart — saves a ring to the signed-in customer's account
 * (client decision, 2026-10-19). Sign-in is required: a guest has no wishlist,
 * so clicking the heart sends them to sign in and nothing is stored locally.
 * Used on product cards and the product detail page.
 *
 * `signedIn` comes from the server (the storefront layout already resolves the
 * session), so the app never needs a next-auth SessionProvider.
 */
export function WishlistButton({
  productId,
  variant = "icon",
  className,
}: {
  productId: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const saved = useIsWishlisted(productId);
  const signedIn = useSignedIn();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(
    null,
  );

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!signedIn) {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }

    if (!saved && getSnapshot().length >= WISHLIST_MAX) {
      setToast({
        message: "Your wishlist is full. Remove a ring to add another.",
        error: true,
      });
      return;
    }

    if (saved) {
      removeItem(productId);
      setToast({ message: "Removed from wishlist.", error: false });
      fetch(`/api/account/wishlist/${productId}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error("failed");
        })
        .catch(() => {
          addItem(productId);
          setToast({ message: "We couldn't update your wishlist.", error: true });
        });
    } else {
      addItem(productId);
      setToast({ message: "Saved to wishlist.", error: false });
      fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("failed");
        })
        .catch(() => {
          removeItem(productId);
          setToast({ message: "We couldn't update your wishlist.", error: true });
        });
    }
  }

  const label = saved ? "Remove from wishlist" : "Save to wishlist";

  const heart = (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-5"
      fill={saved ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d="M10 16.5S3.5 12.6 3.5 8.4A3.4 3.4 0 0110 6.6a3.4 3.4 0 016.5 1.8c0 4.2-6.5 8.1-6.5 8.1z" />
    </svg>
  );

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={
          variant === "full"
            ? `inline-flex min-h-12 items-center justify-center gap-2 rounded-pill border border-border-subtle bg-card px-6 text-body-lg font-medium text-primary transition-colors duration-fast hover:bg-accent-wash ${className ?? ""}`
            : `flex size-10 items-center justify-center rounded-pill bg-card/90 shadow-soft backdrop-blur transition-colors duration-fast hover:bg-card ${className ?? ""} ${
                saved ? "text-accent-strong" : "text-muted"
              }`
        }
      >
        {heart}
        {variant === "full" ? (saved ? "Saved" : "Save to wishlist") : null}
      </button>

      {toast ? (
        <div className="pointer-events-none fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm md:right-6 md:top-24">
          <Toast
            message={toast.message}
            kind={toast.error ? "error" : "success"}
            onDismiss={() => setToast(null)}
          />
        </div>
      ) : null}
    </>
  );
}
