import { CheckoutForm } from "@/components/storefront/checkout-form";
import { auth } from "@/auth";
import { getCurrentCustomer } from "@/lib/account-session";

export const metadata = {
  title: "Checkout",
  robots: { index: false },
};
// Auth-gated (cookies via auth()) — must never be prerendered.
export const instant = false;

export default async function CheckoutPage() {
  const session = await auth();
  const customer =
    session?.user?.customerId ? await getCurrentCustomer() : null;
  return (
    <CheckoutForm
      prefill={
        customer
          ? {
              name: customer.name,
              email: customer.email,
              phone: customer.phone ?? "",
            }
          : null
      }
    />
  );
}
