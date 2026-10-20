"use client";

import { useEffect, useId, useState } from "react";
import { formatPrice } from "@/lib/currency";
import type { Currency } from "@/lib/currency";

/**
 * Fires true one frame after mount so charts can animate from their zero
 * state into place — the single orchestrated moment of the dashboard
 * (DESIGN.md §6). Motion is disabled via CSS under `prefers-reduced-motion`.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return mounted;
}

/**
 * Dependency-free charts (no charting library, by project decision).
 *
 * Every chart is a real figure: a labelled SVG/HTML graphic plus an
 * `sr-only` data table so screen readers get the numbers, not the pixels.
 * Colour is never the only signal — slices and bars always carry a label.
 * The palette is restricted to the design tokens (DESIGN.md §2): gold for the
 * leading series, warm inks/taupe for the rest, and the status colours only
 * where they already mean something (order/payment status).
 */

export interface DonutSlice {
  label: string;
  value: number;
  /** Design-token fill. Each slice is also labelled, never colour alone. */
  color: string;
}

const TAUPE_MUTED = "#CFC7BB";

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  innerR: number,
  start: number,
  end: number,
): string {
  const startOuter = polar(cx, cy, r, end);
  const endOuter = polar(cx, cy, r, start);
  const startInner = polar(cx, cy, innerR, start);
  const endInner = polar(cx, cy, innerR, end);
  const large = end - start <= 180 ? 0 : 1;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${r} ${r} 0 ${large} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

/**
 * Donut — a small number of slices with a big total in the middle and a
 * labelled legend. Hovering or focusing a legend row emphasises its slice.
 */
export function DonutChart({
  title,
  slices,
  currency,
  total,
  emptyLabel = "Nothing to show for this period yet.",
}: {
  title: string;
  slices: DonutSlice[];
  currency: Currency;
  total: number;
  emptyLabel?: string;
}) {
  const headingId = useId();
  const [active, setActive] = useState<number | null>(null);

  const positive = slices.filter((slice) => slice.value > 0);
  const sum = positive.reduce((acc, slice) => acc + slice.value, 0);
  const empty = sum <= 0;

  const arcs: { slice: DonutSlice; path: string }[] = [];
  let cursor = 0;
  for (const slice of positive) {
    const extent = (slice.value / sum) * 360;
    arcs.push({
      slice,
      path: arcPath(100, 100, 84, 52, cursor, cursor + extent),
    });
    cursor += extent;
  }

  const activeSlice = active !== null ? positive[active] : null;
  const mounted = useMounted();

  return (
    <figure className="rounded-md bg-card p-6 shadow-card">
      <figcaption
        id={headingId}
        className="text-body font-medium text-primary"
      >
        {title}
      </figcaption>

      {empty ? (
        <p className="mt-4 text-body text-muted">{emptyLabel}</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 md:flex-row md:items-center">
          <div className="relative shrink-0">
            <svg
              viewBox="0 0 200 200"
              className="size-36"
              role="img"
              aria-labelledby={headingId}
            >
              <circle
                cx="100"
                cy="100"
                r="68"
                fill="none"
                stroke={TAUPE_MUTED}
                strokeWidth="32"
                opacity="0.35"
              />
              {arcs.map((arc, index) => (
                <path
                  key={arc.slice.label}
                  d={arc.path}
                  fill={arc.slice.color}
                  opacity={active === null || active === index ? 1 : 0.4}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  data-ready={mounted ? "true" : "false"}
                  className="chart-sweep"
                  style={{ transitionDelay: mounted ? `${index * 90}ms` : "0ms" }}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-label text-muted">
                {activeSlice ? activeSlice.label : "Total"}
              </span>
              <span className="text-body-lg font-semibold text-primary tabular">
                {formatPrice(activeSlice ? activeSlice.value : total, currency)}
              </span>
            </div>
          </div>

          <ul className="w-full min-w-0 space-y-2">
            {positive.map((slice, index) => (
              <li key={slice.label}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="flex w-full min-w-0 items-start gap-3 rounded-sm px-2 py-1.5 text-left hover:bg-accent-wash"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-3 shrink-0 rounded-pill"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="min-w-0 flex-1 text-body text-primary">
                    {slice.label}
                  </span>
                  <span className="shrink-0 text-body font-semibold text-primary tabular">
                    {formatPrice(slice.value, currency)}
                  </span>
                  <span className="w-10 shrink-0 text-right text-label text-muted tabular">
                    {Math.round((slice.value / sum) * 100)}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Slice</th>
            <th scope="col">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {slices.map((slice) => (
            <tr key={slice.label}>
              <th scope="row">{slice.label}</th>
              <td>{formatPrice(slice.value, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export interface VerticalBarPoint {
  label: string;
  value: number;
  /** Secondary figure shown in the tooltip (for example order count). */
  secondary?: string;
}

/**
 * Trend — a full-width column chart with gridlines and y-axis ticks. The bars
 * are HTML so they reflow with the container; the gridlines are drawn behind.
 */
export function TrendChart({
  points,
  currency,
  total,
  rangeLabel,
}: {
  points: VerticalBarPoint[];
  currency: Currency;
  total: number;
  rangeLabel: string;
}) {
  const withValues = points.some((point) => point.value > 0);
  const ticks = 4;
  const peak = Math.max(...points.map((point) => point.value), 0);
  const step = peak > 0 ? peak / ticks : 0;
  const mounted = useMounted();

  return (
    <div className="relative mt-6 h-64">
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col justify-between"
      >
        {Array.from({ length: ticks + 1 }).map((_, index) => {
          const value = step * (ticks - index);
          return (
            <div key={index} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-right text-label text-muted tabular">
                {peak > 0 ? formatPrice(value, currency) : ""}
              </span>
              <span className="h-px flex-1 bg-border-subtle" />
            </div>
          );
        })}
      </div>

      <div className="absolute inset-y-0 left-16 right-0 flex items-end gap-[3px]">
        {points.map((point, index) => {
          const height = withValues
            ? Math.max(2, Math.round((point.value / peak) * 100))
            : 0;
          return (
            <div
              key={`${point.label}-${index}`}
              className="group relative flex h-full flex-1 items-end"
            >
              <div
                data-ready={mounted ? "true" : "false"}
                className="chart-grow-y w-full rounded-t-sm bg-accent/75 transition-colors group-hover:bg-accent"
                style={{
                  height: `${height}%`,
                  transitionDelay: mounted ? `${Math.round((index / Math.max(points.length - 1, 1)) * 240)}ms` : "0ms",
                }}
              />
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-sm bg-primary px-2.5 py-1.5 text-label text-card shadow-float group-hover:block"
              >
                {point.label}: {formatPrice(point.value, currency)}
                {point.secondary ? ` · ${point.secondary}` : ""}
              </span>
            </div>
          );
        })}
      </div>

      {!withValues ? (
        <p className="absolute inset-x-0 top-4 text-center text-body text-muted">
          No confirmed sales in {rangeLabel} yet.
        </p>
      ) : null}

      <p className="sr-only">
        Sales over {rangeLabel}: {formatPrice(total, currency)} total.
      </p>
    </div>
  );
}

export interface RankedBarRow {
  label: string;
  value: number;
  /** Right-hand secondary figure (for example units sold). */
  meta?: string;
  href?: string;
}

/**
 * RankedBars — horizontal bars for best sellers and category mixes. Widths
 * are relative to the largest row so the ranking reads at a glance.
 */
export function RankedBars({
  rows,
  currency,
  emptyLabel = "No sales in this period yet.",
}: {
  rows: RankedBarRow[];
  currency: Currency;
  emptyLabel?: string;
}) {
  const peak = Math.max(...rows.map((row) => row.value), 0);
  const mounted = useMounted();

  if (rows.length === 0 || peak <= 0) {
    return <p className="mt-4 text-body text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row, index) => {
        const width = Math.max(4, Math.round((row.value / peak) * 100));
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-body text-primary">
                {row.label}
              </span>
              <span className="shrink-0 text-body font-semibold text-primary tabular">
                {formatPrice(row.value, currency)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <span
                aria-hidden="true"
                data-ready={mounted ? "true" : "false"}
                className="chart-grow-x h-2 rounded-pill bg-accent"
                style={{
                  width: `${width}%`,
                  transitionDelay: mounted ? `${index * 70}ms` : "0ms",
                }}
              />
              {row.meta ? (
                <span className="text-label text-muted">{row.meta}</span>
              ) : null}
            </div>
          </>
        );

        return (
          <li key={row.label}>
            {row.href ? (
              <a
                href={row.href}
                className="block rounded-sm px-2 py-1.5 transition-colors hover:bg-accent-wash"
              >
                {content}
              </a>
            ) : (
              <div className="px-2 py-1.5">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface HorizontalBarRow {
  label: string;
  value: number;
  /** Design-token fill for the bar. */
  color: string;
  href?: string;
}

/**
 * HorizontalBars — used for the order-status breakdown. Each bar carries its
 * label and count, so status is never conveyed by colour alone (DESIGN.md §2.2).
 */
export function HorizontalBars({ rows }: { rows: HorizontalBarRow[] }) {
  const peak = Math.max(...rows.map((row) => row.value), 0);
  const mounted = useMounted();

  if (rows.length === 0 || peak <= 0) {
    return <p className="mt-4 text-body text-muted">No orders yet.</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row, index) => {
        const width = Math.max(6, Math.round((row.value / peak) * 100));
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-body text-primary">{row.label}</span>
              <span className="text-body font-semibold text-primary tabular">
                {row.value}
              </span>
            </div>
            <span
              aria-hidden="true"
              data-ready={mounted ? "true" : "false"}
              className="chart-grow-x mt-1.5 block h-2 rounded-pill"
              style={{
                width: `${width}%`,
                backgroundColor: row.color,
                transitionDelay: mounted ? `${index * 70}ms` : "0ms",
              }}
            />
          </>
        );
        return (
          <li key={row.label}>
            {row.href ? (
              <a
                href={row.href}
                className="block rounded-sm px-2 py-1.5 transition-colors hover:bg-accent-wash"
              >
                {body}
              </a>
            ) : (
              <div className="px-2 py-1.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
