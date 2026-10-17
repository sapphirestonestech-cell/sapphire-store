import { CartView } from "@/components/storefront/cart-view";

export const metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default function CartPage() {
  return <CartView />;
}
