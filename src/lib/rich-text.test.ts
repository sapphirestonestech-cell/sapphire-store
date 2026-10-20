import { describe, expect, it } from "vitest";
import {
  descriptionToPlainText,
  hasRichText,
  normalizeDescription,
  sanitizeRichText,
} from "@/lib/rich-text";

describe("sanitizeRichText", () => {
  it("keeps the allowed subset", () => {
    const input =
      "<p>Hello <strong>world</strong> and <em>friends</em></p><ul><li>One</li></ul><h2>Title</h2>";
    expect(sanitizeRichText(input)).toBe(input);
  });

  it("drops script tags and their handler attributes", () => {
    expect(sanitizeRichText('<p onclick="x()">Hi</p>')).toBe("<p>Hi</p>");
    expect(sanitizeRichText('<script>alert(1)</script><p>Safe</p>')).toBe(
      "<p>Safe</p>",
    );
  });

  it("keeps safe hrefs and drops javascript: urls", () => {
    expect(sanitizeRichText('<a href="https://example.com">x</a>')).toBe(
      '<a href="https://example.com">x</a>',
    );
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe(
      "<a>x</a>",
    );
    expect(sanitizeRichText('<a href="/shop">x</a>')).toBe('<a href="/shop">x</a>');
  });

  it("strips disallowed tags but keeps their text", () => {
    expect(sanitizeRichText("<div><p>Text</p></div>")).toBe("<p>Text</p>");
    expect(sanitizeRichText("<img src=x onerror=alert(1)>Hi")).toBe("Hi");
  });

  it("keeps the editor's underline and quote formatting", () => {
    expect(sanitizeRichText("<p><u>under</u></p>")).toBe("<p><u>under</u></p>");
    expect(sanitizeRichText("<blockquote>Quote</blockquote>")).toBe(
      "<blockquote>Quote</blockquote>",
    );
  });

  it("drops inline styles from editor output", () => {
    expect(sanitizeRichText('<p style="color:red">styled</p>')).toBe(
      "<p>styled</p>",
    );
  });
});

describe("normalizeDescription", () => {
  it("wraps legacy plain text into paragraphs", () => {
    expect(normalizeDescription("First line\n\nSecond line")).toBe(
      "<p>First line</p><p>Second line</p>",
    );
  });

  it("sanitises rich html", () => {
    expect(normalizeDescription("<p onclick=x>Hi</p>")).toBe("<p>Hi</p>");
  });

  it("returns empty for blank input", () => {
    expect(normalizeDescription("   ")).toBe("");
    expect(normalizeDescription(null)).toBe("");
  });
});

describe("hasRichText / descriptionToPlainText", () => {
  it("detects markup", () => {
    expect(hasRichText("<p>hi</p>")).toBe(true);
    expect(hasRichText("just words")).toBe(false);
  });

  it("flattens html to text for search and meta", () => {
    expect(descriptionToPlainText("<p>Micro-set <strong>stones</strong></p>")).toBe(
      "Micro-set stones",
    );
    expect(descriptionToPlainText("plain text here")).toBe("plain text here");
  });
});
