"use client";

import { useState } from "react";

export interface SizeOption {
  sizeLabel: string;
  stockQuantity: number;
}

/**
 * Size selector — DESIGN.md §7.13. Pill chips, 44px targets; unavailable
 * sizes are struck through with an accessible label.
 */
export function SizeSelector({
  sizes,
  onChange,
}: {
  sizes: SizeOption[];
  onChange?: (size: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(
    sizes.length === 1 ? sizes[0].sizeLabel : null,
  );

  if (sizes.length === 0) return null;

  return (
    <div className="space-y-2">
      <p id="size-label" className="text-body font-medium">
        Size
      </p>
      <div role="group" aria-labelledby="size-label" className="flex flex-wrap gap-2">
        {sizes.map((s) => {
          const unavailable = s.stockQuantity === 0;
          const active = s.sizeLabel === selected;
          return (
            <button
              key={s.sizeLabel}
              type="button"
              disabled={unavailable}
              aria-pressed={active}
              onClick={() => {
                setSelected(s.sizeLabel);
                onChange?.(s.sizeLabel);
              }}
              className={[
                "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-4 text-body font-medium transition-colors duration-fast",
                unavailable
                  ? "cursor-not-allowed text-border-default"
                  : active
                    ? "bg-primary text-app"
                    : "border border-border-subtle bg-card text-primary hover:bg-accent-wash",
              ].join(" ")}
            >
              {s.sizeLabel}
              {unavailable ? (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-border-default"
                  />
                  <span className="sr-only"> (unavailable)</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
