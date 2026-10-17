"use client";

import { useState } from "react";
import { RingPlaceholder } from "@/components/ui/ring-placeholder";

export interface GalleryImage {
  url: string;
  label: string | null;
  position: number;
}

const PLACEHOLDER_PREFIX = "placeholder:";

/**
 * Product gallery — DESIGN.md §7.10. Main image inside the card frame,
 * thumbnails beneath on mobile and beside on desktop; labels as caption
 * chips; swipe works via scroll-snap on phones.
 */
export function Gallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [];
  const current = list[active] ?? null;
  const isPlaceholder = !current || current.url.startsWith(PLACEHOLDER_PREFIX);

  if (list.length === 0) {
    return (
      <div className="aspect-[4/5] overflow-hidden rounded-image">
        <RingPlaceholder label={productName} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-image bg-pale-sand/40">
        {isPlaceholder ? (
          <RingPlaceholder label={current?.label ?? productName} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={`${current.label ?? "Product"} — ${productName}`}
            className="size-full object-cover"
            width={720}
            height={900}
          />
        )}
        {current?.label ? (
          <span className="absolute bottom-3 left-3 rounded-chip-label bg-pure-white/90 px-2.5 py-1 text-label font-medium text-warm-ink">
            {current.label}
          </span>
        ) : null}
      </div>

      {list.length > 1 ? (
        <ul
          aria-label="Product images"
          className="flex snap-x gap-2 overflow-x-auto pb-1"
        >
          {list.map((img, i) => {
            const selected = i === active;
            return (
              <li key={`${img.url}-${img.position}`} className="snap-start">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1}${img.label ? `: ${img.label}` : ""}`}
                  aria-current={selected}
                  className={`block size-16 overflow-hidden rounded-chip-label transition-shadow duration-fast ${
                    selected
                      ? "shadow-[0_0_0_2px_var(--color-champagne-gold)]"
                      : "shadow-[0_0_0_1px_var(--color-hairline)]"
                  }`}
                >
                  {img.url.startsWith(PLACEHOLDER_PREFIX) ? (
                    <RingPlaceholder label={img.label} className="!bg-pale-sand" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
