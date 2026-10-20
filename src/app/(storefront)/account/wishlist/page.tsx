import Link from "next/link";
import { getCurrentCustomer } from "@/lib/account-session";
import { getWishlistForCustomer } from "@/lib/wishlist-view";
import { WishlistGrid } from "@/components/account/wishlist-grid";

export const metadata = { title: "Wishlist · Account" };

export default async function AccountWishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return (
      <section>
        <h2 className="text-subheading font-semibold">Wishlist</h2>
        <p className="mt-2 text-body text-muted">
          Sign in to see your saved rings.
        </p>
      </section>
    );
  }

  const items = await getWishlistForCustomer(customer.id);

  return (
    <section aria-labelledby="wishlist-heading">
      <h2 id="wishlist-heading" className="text-subheading font-semibold">
        Wishlist
      </h2>
      <p className="mt-1 mb-6 text-body text-muted">
        Rings you have saved, newest first. Add one to your cart when you are
        ready.
      </p>

      {items.length === 0 ? (
        <div className="rounded-md bg-card p-8 text-center shadow-card">
          <p className="text-body-lg text-primary">Nothing saved yet</p>
          <p className="mt-2 text-body text-muted">
            Tap the heart on any ring to save it here for later.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-accent px-8 text-body-lg font-medium text-primary shadow-gold-glow"
          >
            Browse rings
          </Link>
        </div>
      ) : (
        <WishlistGrid items={items} />
      )}
    </section>
  );
}
