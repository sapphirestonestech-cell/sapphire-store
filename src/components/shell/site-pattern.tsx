"use client";

import { useTheme } from "@/components/theme-provider";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * Site-wide irregular pattern background. Very low opacity, pointer-events-none,
 * doesn't interfere with content or interactions. Different character per theme:
 * - Light: faint paper grain
 * - Dark: subtle film grain/noise
 */
export function SitePattern() {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const { theme } = useTheme();

  if (!mounted) {
    return null;
  }

  if (theme === "dark") {
    return (
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.4] mix-blend-soft-light"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="site-grain-dark">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            stitchTiles="stitch"
            seed="13"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#site-grain-dark)" />
      </svg>
    );
  }

  // Light mode: very subtle paper-like grain
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.35] mix-blend-multiply"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="site-grain-light">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.7"
          numOctaves="3"
          stitchTiles="stitch"
          seed="5"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#site-grain-light)" />
    </svg>
  );
}
