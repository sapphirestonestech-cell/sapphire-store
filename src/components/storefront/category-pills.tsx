const REASONS: { title: string; body: string }[] = [
  {
    title: "Timeless Elegance",
    body: "We create jewelry that transcends trends and remains beautiful for generations.",
  },
  {
    title: "Exceptional Craftsmanship",
    body: "Every piece is selected or created with meticulous attention to quality and detail.",
  },
  {
    title: "Trust & Integrity",
    body: "Clear information on materials, pricing and care, so you decide with confidence.",
  },
  {
    title: "Personalized Service",
    body: "Attentive guidance for your occasion, from first message to delivery.",
  },
];

/** Brand pillars strip — ProductReq.md §5.1. Quiet, no second accent. */
export function WhyUs() {
  return (
    <section aria-labelledby="why-us-heading" className="page-width">
      <h2 id="why-us-heading" className="sr-only">
        Our brand pillars
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
