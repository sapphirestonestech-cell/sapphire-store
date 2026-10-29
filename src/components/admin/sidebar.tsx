"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/products", label: "Products", icon: "products" },
  { href: "/admin/categories", label: "Categories", icon: "categories" },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/payments", label: "Payments", icon: "payments" },
  { href: "/admin/delivery", label: "Delivery", icon: "delivery" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "size-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="2" />
          <rect x="13" y="4" width="7" height="7" rx="2" />
          <rect x="4" y="13" width="7" height="7" rx="2" />
          <rect x="13" y="13" width="7" height="7" rx="2" />
        </svg>
      );
    case "products":
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="5" />
          <path d="M12 5l2.5 3L12 11 9.5 8 12 5z" />
        </svg>
      );
    case "categories":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path
            d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"
            strokeLinejoin="round"
          />
          <path d="M9 8h6M9 12h6" strokeLinecap="round" />
        </svg>
      );
    case "payments":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18M7 15h3" strokeLinecap="round" />
        </svg>
      );
    case "delivery":
      return (
        <svg {...common}>
          <path
            d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common} strokeWidth={1.5}>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 6.8l1.6-1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Admin sidebar rail — DESIGN.md §9. 64px white rail, expands with
 * labels on wide screens, active item filled with Gold Wash.
 */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 z-30 flex h-screen w-16 shrink-0 flex-col border-r border-border-subtle bg-card md:w-56">
      <div className="hidden px-6 pb-2 pt-6 md:block">
        <Link href="/" className="font-sans text-heading">
          Sapphire
        </Link>
        <p className="text-label text-muted">Admin</p>
      </div>
      <nav aria-label="Admin" className="flex-1 px-2 py-4 md:px-3">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  className={[
                    "flex min-h-12 items-center gap-3 rounded-sm px-3 transition-colors duration-fast",
                    active
                      ? "bg-accent-wash text-primary"
                      : "text-muted hover:bg-app hover:text-primary",
                  ].join(" ")}
                >
                  <NavIcon name={item.icon} />
                  <span className="hidden text-body font-medium md:inline">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border-subtle p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="View store"
          className="flex min-h-12 w-full items-center gap-3 rounded-sm px-3 text-muted transition-colors duration-fast hover:bg-app hover:text-primary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
          <span className="hidden text-body font-medium md:inline">
            View store
          </span>
        </a>
        <ThemeToggle variant="row" />
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          title="Sign out"
          className="flex min-h-12 w-full items-center gap-3 rounded-sm px-3 text-muted hover:bg-app hover:text-primary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M14 8V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2h5a2 2 0 002-2v-2" />
            <path d="M10 12h10m0 0l-3-3m3 3l-3 3" strokeLinecap="round" />
          </svg>
          <span className="hidden text-body font-medium md:inline">
            {busy ? "Signing out…" : "Sign out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
