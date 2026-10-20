import Link from "next/link";
import type { Metric } from "@/lib/admin/summaries";

/**
 * A compact row of headline figures above an admin list page. Cards stay
 * dense on phones (two up) and spread across the full width on wide screens.
 */
export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => {
        const body = (
          <>
            <dd
              className={`text-subheading font-semibold tabular ${
                metric.tone === "warning"
                  ? "text-warning"
                  : metric.tone === "success"
                    ? "text-success"
                    : "text-primary"
              }`}
            >
              {metric.value}
            </dd>
            <dt className="mt-0.5 text-label text-muted">
              {metric.label}
            </dt>
          </>
        );
        return (
          <div
            key={metric.label}
            className="rounded-md bg-card p-4 shadow-card"
          >
            {metric.href ? (
              <Link
                href={metric.href}
                className="block rounded-sm transition-opacity hover:opacity-80"
              >
                {body}
              </Link>
            ) : (
              body
            )}
          </div>
        );
      })}
    </dl>
  );
}
