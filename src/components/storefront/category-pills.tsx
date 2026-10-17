import Link from "next/link";

/**
 * Category pills — DESIGN.md §7.8. Generated from admin data; wrap
 * gracefully at any count.
 */
export function CategoryPills({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/shop?category=${cat.slug}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-hairline bg-pure-white py-1.5 pl-3 pr-4 text-body text-warm-ink shadow-soft transition-colors duration-fast hover:bg-gold-wash"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4 text-champagne-gold"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <circle cx="8" cy="9.5" r="4.5" />
            <path d="M8 2l2 2.5L8 7 6 4.5 8 2z" />
          </svg>
          {cat.name}
        </Link>
      ))}
    </div>
  );
}

const REASONS: { title: string; body: string }[] = [
  {
    title: "Affordable luxury",
    body: "Beautiful rings priced to be worn, not saved for.",
  },
  {
    title: "Secure payment",
    body: "Pay safely with BACHS or Paystack.",
  },
  {
    title: "Clear delivery costs",
    body: "See the fee and days for your area before you pay.",
  },
  {
    title: "Pre-order available",
    body: "Reserve upcoming designs with a confirmed arrival date.",
  },
];

/** Why us strip — ProductReq.md §5.1. Quiet, no second accent. */
export function WhyUs() {
  return (
    <section aria-labelledby="why-us-heading" className="page-width">
      <h2 id="why-us-heading" className="sr-only">
        Why shop with us
      </h2>
      <div className="grid gap-8 rounded-card bg-pure-white p-8 shadow-card sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:p-10">
        {REASONS.map((reason) => (
          <div key={reason.title} className="space-y-1.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-4 text-champagne-gold"
              fill="currentColor"
            >
              <path d="M8 0l1.8 6.2L16 8l-6.2 1.8L8 16l-1.8-6.2L0 8l6.2-1.8L8 0z" />
            </svg>
            <h3 className="text-body-lg font-semibold">{reason.title}</h3>
            <p className="text-body text-soft-taupe">{reason.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
