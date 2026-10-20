/**
 * Neutral placeholder tile — a Deep Gold ring glyph on a soft sand field.
 * Used until real product photography is provided (DECISIONS.md 2026-10-17).
 * No borrowed or stock imagery.
 */
export function RingPlaceholder({
  label,
  className = "",
}: {
  label?: string | null;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label ? `Placeholder image: ${label}` : "Placeholder image"}
      className={`flex size-full items-center justify-center bg-border-default/50 ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        className="w-1/3 min-w-10 max-w-16 text-accent-strong"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        {/* band */}
        <circle cx="32" cy="38" r="14" />
        {/* stone */}
        <path d="M32 8l7 8-7 8-7-8 7-8z" />
        <path d="M25 16h14" />
      </svg>
    </div>
  );
}
