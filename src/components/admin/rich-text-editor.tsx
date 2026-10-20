"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hasRichText, sanitizeRichText } from "@/lib/rich-text";

/**
 * Description editor — a WYSIWYG contenteditable with a real toolbar.
 *
 * Still dependency-free and still bound by the server sanitiser
 * (src/lib/rich-text.ts): only p, br, strong, em, ul, ol, li, h2, h3 and a[href]
 * survive a save. The browser's own `document.execCommand` drives formatting so
 * the result is plain semantic HTML with no inline styles or classes.
 *
 * The component is uncontrolled while focused (the DOM owns the caret) and
 * emits sanitised HTML upwards on every edit. When the form sets a new value
 * from outside (for example opening a different product), the DOM is re-synced.
 *
 * Plain-text descriptions from before the editor keep working: the first focus
 * converts blank-line text into paragraphs.
 */

type Tool =
  | { kind: "command"; key: string; label: string; title: string; command: string; value?: string; className?: string }
  | { kind: "block"; key: string; label: string; title: string; tag: "h2" | "h3" | "p" }
  | { kind: "link" }
  | { kind: "unlink" }
  | { kind: "divider" };

const TOOLS: Tool[] = [
  { kind: "block", key: "p", label: "¶", title: "Paragraph", tag: "p" },
  { kind: "block", key: "h2", label: "H2", title: "Heading", tag: "h2" },
  { kind: "block", key: "h3", label: "H3", title: "Subheading", tag: "h3" },
  { kind: "divider" },
  { kind: "command", key: "bold", label: "B", title: "Bold (Ctrl+B)", command: "bold", className: "font-semibold" },
  { kind: "command", key: "italic", label: "I", title: "Italic (Ctrl+I)", command: "italic", className: "italic" },
  { kind: "command", key: "underline", label: "U", title: "Underline (Ctrl+U)", command: "underline", className: "underline" },
  { kind: "divider" },
  { kind: "command", key: "ul", label: "• List", title: "Bullet list", command: "insertUnorderedList" },
  { kind: "command", key: "ol", label: "1. List", title: "Numbered list", command: "insertOrderedList" },
  { kind: "command", key: "quote", label: "❝", title: "Quote", command: "formatBlock", value: "blockquote" },
  { kind: "divider" },
  { kind: "link" },
  { kind: "unlink" },
  { kind: "divider" },
  { kind: "command", key: "undo", label: "↶", title: "Undo", command: "undo" },
  { kind: "command", key: "redo", label: "↷", title: "Redo", command: "redo" },
];

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Plain text (no markup) → paragraphs, so legacy values survive the first focus. */
export function plainTextToHtml(value: string): string {
  if (!value.trim()) return "";
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function toEditorHtml(value: string): string {
  if (hasRichText(value)) return value;
  return plainTextToHtml(value);
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string>(value);
  const onChangeRef = useRef(onChange);
  const [focused, setFocused] = useState(false);
  const [activeMarks, setActiveMarks] = useState<Record<string, boolean>>({});
  const [wordCount, setWordCount] = useState(0);

  const isEmpty = useMemo(() => !value.trim(), [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const updateCounts = () => {
    const text = editorRef.current?.innerText ?? "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    const clean = sanitizeRichText(el.innerHTML);
    lastEmitted.current = clean;
    onChangeRef.current(clean);
    updateCounts();
  };

  const refreshMarks = () => {
    const marks: Record<string, boolean> = {};
    for (const key of ["bold", "italic", "underline"]) {
      try {
        marks[key] = document.queryCommandState(key);
      } catch {
        marks[key] = false;
      }
    }
    setActiveMarks(marks);
  };

  const run = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emit();
    refreshMarks();
  };

  // Keep the DOM in sync only when the value changed from OUTSIDE (the form
  // loading another product). While typing, the DOM is the source of truth so
  // the caret is never reset.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value === lastEmitted.current) return;
    const next = toEditorHtml(value);
    if (el.innerHTML !== next) el.innerHTML = next;
    lastEmitted.current = value;
    const text = el.innerText ?? "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, [value]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML === "") {
      el.innerHTML = toEditorHtml(value);
      lastEmitted.current = value;
    }
    const text = el.innerText ?? "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyBlock(tag: "h2" | "h3" | "p") {
    run("formatBlock", tag === "p" ? "p" : `<${tag}>`);
  }

  function addLink() {
    const url = window.prompt("Link address (https://…)");
    if (!url) return;
    const safe = /^(https?:|mailto:|\/|#)/i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;
    run("createLink", safe);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Keep the toolbar shortcuts on the editor, and keep Enter inside a
    // paragraph rather than inserting a raw <div>/<br>.
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      addLink();
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-1 rounded-sm border border-border-subtle bg-card p-1.5"
        role="toolbar"
        aria-label="Formatting"
        aria-controls={id}
      >
        {TOOLS.map((tool, index) => {
          if (tool.kind === "divider") {
            return (
              <span
                key={`divider-${index}`}
                aria-hidden="true"
                className="mx-0.5 h-6 w-px bg-border-subtle"
              />
            );
          }
          if (tool.kind === "link") {
            return (
              <button
                key="link"
                type="button"
                title="Add link (Ctrl+K)"
                aria-label="Add link"
                onMouseDown={(e) => e.preventDefault()}
                onClick={addLink}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-pill px-2 text-label text-primary transition-colors hover:bg-accent-wash"
              >
                🔗
              </button>
            );
          }
          if (tool.kind === "unlink") {
            return (
              <button
                key="unlink"
                type="button"
                title="Remove link"
                aria-label="Remove link"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run("unlink")}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-pill px-2 text-label text-primary transition-colors hover:bg-accent-wash"
              >
                ⛓️‍💥
              </button>
            );
          }
          if (tool.kind === "block") {
            return (
              <button
                key={tool.key}
                type="button"
                title={tool.title}
                aria-label={tool.title}
                aria-pressed={activeMarks[`block:${tool.tag}`] ?? false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyBlock(tool.tag)}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-pill px-2 text-label text-primary transition-colors hover:bg-accent-wash"
              >
                {tool.label}
              </button>
            );
          }
          const isActive = activeMarks[tool.command] ?? false;
          return (
            <button
              key={tool.key}
              type="button"
              title={tool.title}
              aria-label={tool.title}
              aria-pressed={isActive}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(tool.command, tool.value)}
              className={[
                "inline-flex h-8 min-w-8 items-center justify-center rounded-pill px-2 text-label text-primary transition-colors hover:bg-accent-wash",
                tool.className ?? "",
                isActive ? "bg-accent-wash" : "",
              ].join(" ")}
            >
              {tool.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          id={id}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onKeyDown={onKeyDown}
          onKeyUp={refreshMarks}
          onMouseUp={refreshMarks}
          onFocus={() => {
            setFocused(true);
            refreshMarks();
          }}
          onBlur={() => {
            setFocused(false);
            emit();
          }}
          data-placeholder={placeholder ?? ""}
          className={[
            "rich-text min-h-40 w-full rounded-sm border border-border-subtle bg-card px-4 py-3 text-body-lg text-primary outline-none focus-visible:border-accent",
            "empty:before:pointer-events-none empty:before:text-muted empty:before:content-[attr(data-placeholder)]",
            className ?? "",
          ].join(" ")}
        />
      </div>

      <div className="flex items-center justify-between text-label text-muted">
        <span>{isEmpty ? "Nothing yet" : `${wordCount} ${wordCount === 1 ? "word" : "words"}`}</span>
        <span aria-live="polite">
          {focused ? "Editing" : "Formatting is saved with the ring"}
        </span>
      </div>
    </div>
  );
}
