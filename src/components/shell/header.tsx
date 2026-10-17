"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { CartLink } from "@/components/cart-provider";

export interface NavCategory {
  slug: string;
  name: string;
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
      className="relative hidden flex-1 items-center md:flex"
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
        className="h-12 w-full rounded-pill border border-hairline bg-pure-white py-1 pl-5 pr-14 text-body-lg text-warm-ink placeholder:text-soft-taupe"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 flex size-10 items-center justify-center rounded-pill bg-champagne-gold text-warm-ink shadow-gold-glow transition-transform duration-fast hover:scale-105"
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
        className="flex size-11 items-center justify-center rounded-pill text-warm-ink md:hidden"
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
            className="absolute inset-0 bg-warm-ink/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-card bg-pure-white p-6 shadow-float">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-heading font-display">Shop</p>
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
                <li>
                  <Link
                    href="/shop"
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-pill px-4 text-body-lg hover:bg-gold-wash"
                  >
                    All rings
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex min-h-11 items-center rounded-pill px-4 text-body-lg hover:bg-gold-wash"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-6 border-t border-hairline pt-6">
              <SearchField />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * Header — DESIGN.md §7.2. White surface, sticky with a float shadow
 * once the page moves. Wordmark left, category links centre on desktop,
 * search / currency switcher / cart right.
 */
export function Header({ categories }: { categories: NavCategory[] }) {
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
      className={`sticky top-0 z-40 bg-pure-white transition-shadow duration-fast ${
        scrolled ? "shadow-float" : ""
      }`}
    >
      <div className="page-width flex h-16 items-center gap-3 md:h-20 md:gap-6">
        <Link
          href="/"
          className="font-display text-heading-lg font-medium tracking-tight text-warm-ink"
        >
          Sapphire
        </Link>

        <nav aria-label="Categories" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center rounded-pill px-3.5 text-body text-warm-ink hover:bg-gold-wash"
              >
                All rings
              </Link>
            </li>
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="inline-flex min-h-11 items-center rounded-pill px-3.5 text-body text-warm-ink hover:bg-gold-wash"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <div className="hidden flex-1 md:flex md:max-w-xs md:px-2">
            <SearchField />
          </div>
          <CurrencySwitcher className="hidden sm:inline-flex" />
          <CartLink />
          <MobileMenu categories={categories} />
          <MobileMenu categories={categories} />
        </div>
      </div>
      {q ? <span className="sr-only">Search query: {q}</span> : null}
    </header>
  );
}
