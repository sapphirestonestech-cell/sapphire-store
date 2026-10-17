import Link from "next/link";
import { TAGLINE, POSITIONING_LINE } from "@/lib/tagline";

const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: "Shop",
      links: [
        { label: "All rings", href: "/shop" },
        { label: "Pre-order collection", href: "/shop?availability=pre_order" },
        { label: "New arrivals", href: "/shop?sort=newest" },
      ],
    },
    {
      heading: "Help",
      links: [
        { label: "Shipping and delivery", href: "/shipping" },
        { label: "Pre-order policy", href: "/preorder-policy" },
        { label: "Returns and refunds", href: "/returns" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      heading: "Policies",
      links: [
        { label: "Privacy policy", href: "/privacy" },
        { label: "Terms of service", href: "/terms" },
      ],
    },
  ];

/**
 * Current year for the copyright line. Cached so the atomic `new Date()`
 * read does not block prerendering under `cacheComponents`; the value only
 * changes once a year.
 */
async function copyrightYear(): Promise<number> {
  "use cache";
  return new Date().getFullYear();
}

/** Footer — DESIGN.md §7.20. Charcoal band, tagline repeated. */
export async function Footer() {
  const year = await copyrightYear();
  return (
    <footer className="mt-auto bg-charcoal-band text-ivory-canvas">
      <div className="page-width grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="font-display text-heading-lg">Sapphire</p>
          <p className="max-w-60 text-body text-pale-sand">{TAGLINE}</p>
          <p className="max-w-60 text-body text-pale-sand">{POSITIONING_LINE}</p>
        </div>
        {FOOTER_LINKS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h2 className="mb-3 text-body-lg font-semibold">{group.heading}</h2>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-body text-pale-sand underline-offset-4 hover:text-ivory-canvas hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-ivory-canvas/15">
        <div className="page-width flex flex-col gap-2 py-6 text-label text-pale-sand sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Sapphire. All rights reserved.</p>
          <p>Payments secured by BACHS and Paystack.</p>
        </div>
      </div>
    </footer>
  );
}
