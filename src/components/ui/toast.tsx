/**
 * Toast card — DESIGN.md §7.19: white 20px-radius card with the `float`
 * shadow and a small status icon; wording matches the action ("Added to
 * cart"). Success toasts are dismissed by the caller after a few seconds;
 * errors stay until the customer dismisses them (or an interaction clears
 * them). Status colour is always paired with an icon (DESIGN.md §2.2).
 */

export interface ToastProps {
  message: string;
  kind: "success" | "error";
  onDismiss?: () => void;
}

export function Toast({ message, kind, onDismiss }: ToastProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className="toast-in pointer-events-auto flex max-w-md items-center gap-3 rounded-image bg-pure-white px-4 py-3 shadow-float"
    >
      <span
        aria-hidden="true"
        className={
          kind === "error" ? "text-status-error" : "text-status-success"
        }
      >
        {kind === "error" ? (
          <svg
            viewBox="0 0 20 20"
            className="size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <circle cx="10" cy="10" r="7.5" />
            <path d="M10 6.5v4.5" />
            <path d="M10 13.5h.01" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 20 20"
            className="size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="10" cy="10" r="7.5" />
            <path d="m6.75 10.25 2.2 2.2 4.3-4.7" />
          </svg>
        )}
      </span>
      <p className="text-body text-warm-ink">{message}</p>
      {kind === "error" && onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-pill text-soft-taupe transition-colors hover:bg-gold-wash hover:text-warm-ink"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="m6 6 8 8M14 6l-8 8" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
