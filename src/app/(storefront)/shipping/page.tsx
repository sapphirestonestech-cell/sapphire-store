import { StaticPageShell } from "@/components/storefront/static-page-shell";

export const metadata = { title: "Shipping and delivery" };

export default function Page() {
  return (
    <StaticPageShell
      title="Shipping and delivery"
      blurb="Delivery fees and estimated days are set for each area we deliver to, and shown before you pay. The full delivery guide is being prepared."
    />
  );
}
