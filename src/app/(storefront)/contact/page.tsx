import { StaticPageShell } from "@/components/storefront/static-page-shell";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <StaticPageShell
      title="Contact us"
      blurb="Whether you are choosing an engagement ring, planning a gift or checking on a pre-order, we are here to help. Our email and WhatsApp details are being added here; once they are live, we will respond as quickly as we can."
    />
  );
}
