import { CheckoutForm } from "@/components/storefront/checkout-form";

export const metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
