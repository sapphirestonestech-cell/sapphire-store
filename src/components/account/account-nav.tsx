"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/account/sign-out-button";

const NAV = [
  { href: "/account", label: "Profile", icon: "profile" },
  { href: "/account/orders", label: "Orders", icon: "orders" },
  { href: "/account/wishlist", label: "Wishlist", icon: "wishlist" },
  { href: "/account/addresses", label: "Addresses", icon: "addresses" },
];

function NavIcon({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "size-5 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" strokeLinecap="round" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path
            d="M4 8.5L12 5l8 3.5v7L12 19l-8-3.5v-7z"
            strokeLinejoin="round"
          />
          <path d="M4 8.5L12 12l8-3.5M12 12v7" strokeLinejoin="round" />
        </svg>
      );
    case "wishlist":
      return (
        <svg {...common}>
          <path
            d="M12 20S4 15.2 4 9.9A4.1 4.1 0 0112 7.7a4.1 4.1 0 018 2.2C20 15.2 12 20 12 20z"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "addresses":
      return (
        <svg {...common}>
          <path
            d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Account sidebar — a vertical menu card beside the account content
 * (replaces the old pill tabs). Active item filled with Gold Wash, sign out
 * resting at the foot, mirroring the admin rail (DESIGN.md §9).
 * Stacks above the content on phones.
 */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Account"
      className="self-start overflow-hidden rounded-md bg-card shadow-card"
    >
      <ul className="p-2">
        {NAV.map((item) => {
          const active =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-sm px-4 text-body transition-colors duration-fast ${
                  active
                    ? "bg-accent-wash font-medium text-primary"
                    : "text-muted hover:bg-app hover:text-primary"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border-subtle p-3">
        <SignOutButton className="w-full justify-center" />
      </div>
    </nav>
  );
}
