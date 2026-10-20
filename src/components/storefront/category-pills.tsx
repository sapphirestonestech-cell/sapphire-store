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
      <div className="grid gap-8 rounded-md bg-card p-8 shadow-card sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:p-10">
        {REASONS.map((reason) => (
          <div key={reason.title} className="space-y-1.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-4 text-accent"
              fill="currentColor"
            >
              <path d="M8 0l1.8 6.2L16 8l-6.2 1.8L8 16l-1.8-6.2L0 8l6.2-1.8L8 0z" />
            </svg>
            <h3 className="text-body-lg font-semibold">{reason.title}</h3>
            <p className="text-body text-muted">{reason.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
