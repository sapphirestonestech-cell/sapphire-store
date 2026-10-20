/**
 * Rich-text description — a deliberately small, dependency-free HTML subset.
 *
 * The admin's description editor produces only the tags below; everything else
 * is stripped before the string is stored, and the storefront renders the
 * stored string with `dangerouslySetInnerHTML` only after this same sanitiser
 * has run. Sanitising on the way IN (payload builder) and again on the way OUT
 * (render) means a value from an older record or a direct DB edit can never
 * place script or markup on the page.
 *
 * Allowed: p, br, strong, b, em, i, ul, ol, li, h2, h3, a[href].
 * Everything else — including all attributes except a safe `href` — is
 * dropped. No event handlers, no styles, no images, no scripts.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "blockquote",
  "a",
]);

const VOID_TAGS = new Set(["br"]);

/**
 * Elements whose CONTENT (not just their tags) must be discarded — otherwise
 * `<script>alert(1)</script>` would leave the bare text `alert(1)` in place.
 */
const DROP_WITH_CONTENT =
  /<(script|style|iframe|object|embed|svg|math|template|noscript)\b[\s\S]*?<\/\1\s*>/gi;

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;

/** Only http(s)/mailto/relative hrefs survive — blocks javascript: and data:. */
function safeHref(raw: string): string | null {
  const value = raw.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (!value) return null;
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if (value.startsWith("/") || value.startsWith("#")) return value;
  return null;
}

function safeAttrs(tag: string, attrText: string): string {
  if (tag !== "a") return "";
  const match = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrText);
  if (!match) return "";
  const href = safeHref(match[2] ?? match[3] ?? match[4] ?? "");
  if (!href) return "";
  const escaped = href.replace(/"/g, "&quot;");
  return ` href="${escaped}"`;
}

/** True when the string already contains any markup we allow. */
export function hasRichText(value: string): boolean {
  return /<(p|br|strong|b|em|i|u|ul|ol|li|h2|h3|blockquote|a)\b/i.test(value);
}

/**
 * Strip a description to the allowed subset. Returns "" when nothing remains.
 */
export function sanitizeRichText(input: string): string {
  if (!input) return "";
  let out = "";
  let last = 0;
  let match: RegExpExecArray | null;

  // Remove dangerous elements together with their contents, and any unclosed
  // opening tag of the same families (e.g. a stray `<script>` with no close).
  const cleaned = input
    .replace(DROP_WITH_CONTENT, "")
    .replace(/<\/?(script|style|iframe|object|embed|svg|math|template|noscript)\b[^>]*>/gi, "");

  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(cleaned)) !== null) {
    const [full, rawTag, attrText] = match;
    const tag = rawTag.toLowerCase();
    out += cleaned.slice(last, match.index);
    last = match.index + full.length;

    if (!ALLOWED_TAGS.has(tag)) continue;

    const closing = full.startsWith("</");
    if (closing) {
      if (!VOID_TAGS.has(tag)) out += `</${tag}>`;
      continue;
    }
    out += `<${tag}${safeAttrs(tag, attrText)}${VOID_TAGS.has(tag) ? " /" : ""}>`;
  }
  out += cleaned.slice(last);

  // Drop any attribute the tag-stripper could not have produced (defence in
  // depth) and any leftover angle brackets in text.
  out = out.replace(
    /<(\/?)([a-z0-9]+)((?:\s+href="[^"]*")?)\s*\/?>/gi,
    (_m, slash, tag, attrs) => {
      if (!ALLOWED_TAGS.has(tag.toLowerCase())) return "";
      if (VOID_TAGS.has(tag.toLowerCase())) return "<br />";
      return `<${slash}${tag.toLowerCase()}${attrs}>`;
    },
  );
  out = out.replace(
    /<(?!\/?(?:p|br|strong|b|em|i|u|ul|ol|li|h2|h3|blockquote|a)[\s/>])/gi,
    "&lt;",
  );

  return out.trim();
}

/**
 * Plain text (no markup) → paragraphs, so existing seeded descriptions keep
 * their blank-line breaks without us having to migrate them.
 */
function plainTextToHtml(value: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escape(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/**
 * The single entry point used by the payload builder: takes whatever the admin
 * typed (rich HTML or legacy plain text) and returns a stored-safe string.
 */
export function normalizeDescription(input: string | undefined | null): string {
  const value = (input ?? "").trim();
  if (!value) return "";
  return hasRichText(value) ? sanitizeRichText(value) : plainTextToHtml(value);
}

/** Strip tags to plain text — used for search, meta and previews. */
export function descriptionToPlainText(input: string): string {
  if (!input) return "";
  if (!hasRichText(input)) return input.replace(/\s+/g, " ").trim();
  return input
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<\/(p|li|h2|h3|ul|ol)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
