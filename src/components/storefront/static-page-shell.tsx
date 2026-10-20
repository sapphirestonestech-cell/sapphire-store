import Link from "next/link";

/**
 * Placeholder for policy and support pages (§5.9, Phase 4 content).
 * Real policy text must come from the store owner — nothing is invented.
 */
export function StaticPageShell({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <div className="page-width py-16 md:py-24">
      <div className="mx-auto max-w-xl rounded-md bg-card p-10 shadow-card">
        <h1 className="font-sans text-heading-lg">{title}</h1>
        <p className="mt-4 text-body-lg text-muted">{blurb}</p>
        <p className="mt-4 text-body-lg text-muted">
          Need help now?{" "}
          <Link
            href="/contact"
            className="text-accent-strong underline underline-offset-4"
          >
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
