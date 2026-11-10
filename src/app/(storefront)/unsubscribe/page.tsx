import Link from "next/link";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

export const metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/* The whole page depends on the URL token, so it can never be prerendered
   — same treatment as checkout/return and the auth pages (see DECISIONS.md). */
export const instant = false;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.token) ? sp.token[0] : sp.token;
  const token = typeof raw === "string" ? raw : "";
  const email = token ? verifyUnsubscribeToken(token) : null;
  const done = (Array.isArray(sp.done) ? sp.done[0] : sp.done) === "1";

  return (
    <div className="page-width py-16 md:py-24">
      <div className="mx-auto max-w-xl rounded-md bg-card p-8 shadow-card md:p-10">
        <h1 className="font-sans text-heading-lg">Marketing emails</h1>
        {!email ? (
          <>
            <p className="mt-4 text-body-lg text-muted">
              This unsubscribe link is invalid or has expired. If you still
              receive marketing email, contact us and we will remove you.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-accent px-6 text-body-lg font-medium text-primary"
            >
              Contact us
            </Link>
          </>
        ) : done ? (
          <>
            <p className="mt-4 text-body-lg text-muted">
              <strong className="font-medium text-primary">{email}</strong> will
              not receive marketing emails again. Order and delivery emails are
              not affected.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-accent px-6 text-body-lg font-medium text-primary"
            >
              Back to the shop
            </Link>
          </>
        ) : (
          <>
            <p className="mt-4 text-body-lg text-muted">
              Stop marketing emails at{" "}
              <strong className="font-medium text-primary">{email}</strong>. You
              will still receive order, payment and delivery emails.
            </p>
            <form action="/api/unsubscribe" method="post" className="mt-6">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center rounded-pill bg-accent px-6 text-body-lg font-medium text-primary"
              >
                Unsubscribe
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
