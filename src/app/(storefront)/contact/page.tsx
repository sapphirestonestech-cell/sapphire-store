import { StaticPageShell } from "@/components/storefront/static-page-shell";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <StaticPageShell
      title="Contact us"
      blurb="Our email and WhatsApp details are being added here. If you need help with a ring, a pre-order or an order already placed, reach out as soon as the details go live and we will respond as quickly as we can."
    />
  );
}
