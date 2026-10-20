import { TAGLINE } from "@/lib/tagline";

/**
 * Announcement bar — DESIGN.md §7.1. Carries the brand promise on every
 * page; the tagline itself cannot be dismissed.
 */
export function AnnouncementBar({ extra }: { extra?: string }) {
  return (
    <div className="bg-[#151210] text-white">
      <div className="page-width flex min-h-10 items-center justify-center gap-2 py-2 text-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-3 shrink-0 text-accent"
          fill="currentColor"
        >
          <path d="M8 0l1.8 6.2L16 8l-6.2 1.8L8 16l-1.8-6.2L0 8l6.2-1.8L8 0z" />
        </svg>
        <p className="text-body text-white">
          {TAGLINE}
          {extra ? <span className="text-accent"> {extra}</span> : null}
        </p>
      </div>
    </div>
  );
}
