import { StaticPageShell } from "@/components/storefront/static-page-shell";

export const metadata = { title: "Frequently asked questions" };

export default function Page() {
  return (
    <StaticPageShell
      title="Frequently asked questions"
      blurb="Answers to common questions about sizing, pre-orders, delivery and payments are being prepared. If your question cannot wait, contact us and we will guide you personally."
    />
  );
}
