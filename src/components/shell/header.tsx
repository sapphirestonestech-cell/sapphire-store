"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { signOut } from "next-auth/react";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartLink } from "@/components/cart-provider";

export interface NavCategory {
  slug: string;
  name: string;
}

export interface HeaderUser {
  name?: string | null;
  /** Admin access: HMAC admin session, or an AdminUser with this email. */
  isAdmin?: boolean;
  /** Signed in as a storefront customer (Auth.js session). */
  isCustomer?: boolean;
}

function SearchField() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/shop");
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="relative flex flex-1 items-center"
    >
      <label htmlFor="header-search" className="sr-only">
        Search rings
      </label>
      <input
        id="header-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search rings"
        className="h-12 w-full rounded-pill border border-border-subtle bg-card py-1 pl-5 pr-14 text-body-lg text-primary placeholder:text-muted"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 flex size-10 items-center justify-center rounded-pill bg-accent text-primary shadow-gold-glow transition-transform duration-fast hover:scale-105"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13.5 13.5L17 17" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}

function MobileMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex size-11 items-center justify-center rounded-pill text-primary md:hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-primary/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-card bg-card p-6 shadow-float">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-heading font-sans">Shop</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-11 items-center justify-center"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>
            <nav>
              <ul className="space-y-1">
                <li className="px-4 pb-1 text-label font-medium text-muted">
                  Categories
                </li>
                <li>
                  <Link
                    href="/shop"
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-pill px-4 text-body hover:bg-accent-wash"
                  >
                    All rings
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex min-h-11 items-center rounded-pill px-4 text-body hover:bg-accent-wash"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li className="mt-3 border-t border-border-subtle pt-3">
                  <Link
                    href="/track"
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-pill px-4 text-body hover:bg-accent-wash"
                  >
                    Track order
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop?availability=pre_order"
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-pill px-4 text-body hover:bg-accent-wash"
                  >
                    Pre-order
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="mt-6 border-t border-border-subtle pt-6">
              <SearchField />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SignInLink() {
  return (
    <Link
      href="/sign-in"
      aria-label="Sign in"
      className="flex size-11 items-center justify-center rounded-pill text-primary hover:bg-accent-wash"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="10" cy="7" r="3" />
        <path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
      </svg>
    </Link>
  );
}

function MenuAccountIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
    </svg>
  );
}

function MenuDashboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="11" y="3.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="3.5" y="11" width="5.5" height="5.5" rx="1.5" />
      <rect x="11" y="11" width="5.5" height="5.5" rx="1.5" />
    </svg>
  );
}

function MenuSignOutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 3H5a1 1 0 00-1 1v12a1 1 0 001 1h3" strokeLinecap="round" />
      <path d="M13 13l3-3-3-3M16 10H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MENU_ITEM_CLASS =
  "flex min-h-10 w-full items-center gap-2.5 rounded-sm px-3 text-left text-body text-primary hover:bg-accent-wash";

/**
 * Account menu — DESIGN.md §7.2 account entry. Avatar + name opens a
 * dropdown with "View user account", "View back office" (admins only) and
 * "Log out". Replaces the old lone logout icon so signing out is never a
 * one-click accident. Escape and outside clicks close it.
 */
function AccountMenu({ user }: { user: HeaderUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return <SignInLink />;

  const account = user;
  const firstName = account.name?.split(" ")[0] ?? "Account";
  const initial = (account.name?.trim().charAt(0) || "A").toUpperCase();

  async function onLogout() {
    // Clear the admin HMAC cookie too — it is httpOnly, so the browser
    // cannot drop it from here; the route does it server-side.
    if (account.isAdmin) {
      try {
        await fetch("/api/admin/logout", { method: "POST" });
      } catch {
        // Best-effort: still sign out of the customer session below.
      }
    }
    if (account.isCustomer) {
      await signOut({ callbackUrl: "/" });
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-2 rounded-pill py-1 pl-1 pr-2.5 text-label text-primary hover:bg-accent-wash"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-pill bg-accent-wash text-label font-medium text-accent-strong ring-1 ring-border-subtle"
        >
          {initial}
        </span>
        <span className="hidden max-w-24 truncate sm:inline">{firstName}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`size-3.5 max-sm:hidden transition-transform duration-fast ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 7.5l5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-1 min-w-56 overflow-hidden rounded-md border border-border-subtle bg-card p-1.5 shadow-float"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={MENU_ITEM_CLASS}
          >
            <MenuAccountIcon />
            View user account
          </Link>
          {account.isAdmin ? (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={MENU_ITEM_CLASS}
            >
              <MenuDashboardIcon />
              View back office
            </Link>
          ) : null}
          <div className="my-1.5 border-t border-border-subtle" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void onLogout();
            }}
            className={MENU_ITEM_CLASS}
          >
            <MenuSignOutIcon />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Categories dropdown — DESIGN.md §7.2 nav (client instruction, 2026-10-18:
 * the desktop nav carries exactly three items: Categories, Track order,
 * Pre-order). Escape and outside clicks close it, like AccountMenu.
 */
function CategoriesMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1 rounded-pill px-3.5 text-label text-primary hover:bg-accent-wash"
      >
        Categories
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`size-3.5 transition-transform duration-fast ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 7.5l5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Categories"
          className="absolute left-0 top-full z-50 mt-1 max-h-72 min-w-52 overflow-y-auto rounded-md border border-border-subtle bg-card p-1.5 shadow-float"
        >
          <Link
            href="/shop"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={MENU_ITEM_CLASS}
          >
            All rings
          </Link>
          {categories.length > 0 ? (
            <div className="my-1.5 border-t border-border-subtle" />
          ) : null}
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={MENU_ITEM_CLASS}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Header — DESIGN.md §7.2. White surface, sticky with a float shadow
 * once the page moves. Wordmark left, three nav items centre on desktop,
 * search / account / currency switcher / cart right.
 */
export function Header({
  categories,
  user,
}: {
  categories: NavCategory[];
  user: HeaderUser | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-card transition-shadow duration-fast ${
        scrolled ? "shadow-float" : ""
      }`}
    >
      <div className="page-width flex h-16 items-center gap-2 sm:gap-3 md:h-20 md:gap-6">
        <Link
          href="/"
          className="font-sans text-heading-lg font-medium tracking-tight text-primary"
        >
          Sapphire
        </Link>

        <nav aria-label="Main" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-1">
            <li>
              <CategoriesMenu categories={categories} />
            </li>
            <li>
              <Link
                href="/track"
                className="inline-flex min-h-11 items-center rounded-pill px-3.5 text-label text-primary hover:bg-accent-wash"
              >
                Track order
              </Link>
            </li>
            <li>
              <Link
                href="/shop?availability=pre_order"
                className="inline-flex min-h-11 items-center rounded-pill px-3.5 text-label text-primary hover:bg-accent-wash"
              >
                Pre-order
              </Link>
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5 md:gap-2">
          <div className="hidden flex-1 md:flex md:max-w-xs md:px-2">
            <SearchField />
          </div>
          {/* Currency stays reachable at every width (ProductReq.md:
              "Currency switcher always reachable from the header"); its
              component compacts to symbols below sm. The theme toggle is
              decorative below sm (OS preference still applies) and would
              push this cluster past the viewport. `max-sm:hidden` rather
              than `hidden sm:inline-flex`: Tailwind v4 sorts `.hidden`
              before `.inline-flex`, so a base `hidden` loses to the
              component's own base `inline-flex`. */}
          <CurrencySwitcher />
          <ThemeToggle className="max-sm:hidden" />
          <CartLink />
          <AccountMenu user={user} />
        <MobileMenu categories={categories} />
      </div>
      </div>
      {q ? <span className="sr-only">Search query: {q}</span> : null}
    </header>
  );
}
