/**
 * Toast card — DESIGN.md §7.19: white 20px-radius card with the `float`
 * shadow, a status icon and a thin status-colour accent, pinned to the
 * **top-right** below the sticky header (client instruction, 2026-10-19).
 * Success toasts are dismissed by the caller after a few seconds; errors stay
 * until the customer dismisses them (or an interaction clears them). Status
 * colour is always paired with an icon (DESIGN.md §2.2).
 */

export interface ToastProps {
  message: string;
  kind: "success" | "error";
  onDismiss?: () => void;
}

export function Toast({ message, kind, onDismiss }: ToastProps) {
  const isError = kind === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className="toast-in pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-sm bg-card py-3.5 pl-4 pr-2.5 shadow-float"
    >
      <span
        aria-hidden="true"
        className={`toast-accent absolute inset-y-0 left-0 w-1 ${
          isError ? "bg-danger" : "bg-success"
        }`}
      />
      <span
        aria-hidden="true"
        className={`toast-icon mt-0.5 shrink-0 ${
          isError ? "text-danger" : "text-success"
        }`}
      >
        {isError ? (
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
      <p className="min-w-0 flex-1 pt-0.5 text-body leading-snug text-primary">
        {message}
      </p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-pill text-muted transition-colors hover:bg-accent-wash hover:text-primary"
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
