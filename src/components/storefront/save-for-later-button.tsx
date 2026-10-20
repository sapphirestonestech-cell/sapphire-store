"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeItem as removeFromCart } from "@/lib/cart";
import {
  addItem as addToWishlistStore,
  getSnapshot,
  removeItem as removeFromWishlistStore,
  WISHLIST_MAX,
} from "@/lib/wishlist";
import { Toast } from "@/components/ui/toast";
import { useSignedIn } from "@/components/signed-in-provider";

/**
 * "Save for later" — moves a cart line into the signed-in customer's wishlist.
 * A guest has no wishlist, so the action sends them to sign in (client
 * decision, 2026-10-19). Used on the checkout order summary and the cart.
 */
export function SaveForLaterButton({
  productId,
  sizeLabel,
  className,
}: {
  productId: string;
  sizeLabel: string;
  className?: string;
}) {
  const signedIn = useSignedIn();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(
    null,
  );

  function onClick() {
    if (!signedIn) {
      router.push("/sign-in?callbackUrl=/checkout");
      return;
    }
    if (!getSnapshot().some((i) => i.productId === productId)) {
      if (getSnapshot().length >= WISHLIST_MAX) {
        setToast({
          message: "Your wishlist is full. Remove a ring to add another.",
          error: true,
        });
        return;
      }
      addToWishlistStore(productId);
      fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("failed");
        })
        .catch(() => {
          removeFromWishlistStore(productId);
          setToast({
            message: "We couldn't update your wishlist.",
            error: true,
          });
        });
    }
    removeFromCart(productId, sizeLabel);
    setToast({ message: "Saved to your wishlist.", error: false });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={
          className ??
          "text-body text-muted underline-offset-4 hover:text-primary hover:underline"
        }
      >
        Save for later
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
