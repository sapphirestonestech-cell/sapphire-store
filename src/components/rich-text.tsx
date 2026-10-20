import { descriptionToPlainText, hasRichText, sanitizeRichText } from "@/lib/rich-text";

/**
 * Renders a product description that may be rich HTML or legacy plain text.
 *
 * The stored value is sanitised AGAIN here (not just on save), so a value that
 * predates the editor — or was edited directly in the database — still cannot
 * place markup on the page. Plain text keeps its blank-line paragraph breaks;
 * rich HTML is rendered with the allowed subset only.
 *
 * Typography is applied through the `rich-text` class (see globals.css) so the
 * editor's tags (p, strong, em, ul, h2) look correct without per-tag classes.
 */
export function RichText({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  if (!value.trim()) return null;

  if (!hasRichText(value)) {
    return (
      <div className={`rich-text ${className}`.trim()}>
        {descriptionToPlainText(value)
          .split(/\n{2,}/)
          .map((block) => block.trim())
          .filter(Boolean)
          .map((block, i) => (
            <p key={i}>{block}</p>
          ))}
      </div>
    );
  }

  return (
    <div
      className={`rich-text ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(value) }}
    />
  );
}
