import {
  ORDER_STATUS_LABELS,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
  type StatusTone,
} from "@/lib/order-status";
import type { OrderStatus } from "@/lib/models/order";

const TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-danger/10 text-danger",
  neutral: "bg-border-default/60 text-primary",
};

function ToneIcon({ tone }: { tone: StatusTone }) {
  const common = {
    viewBox: "0 0 12 12",
    className: "size-3 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    "aria-hidden": true as const,
  };
  if (tone === "success") {
    return (
      <svg {...common}>
        <path d="M2.5 6.2l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tone === "warning" || tone === "error") {
    return (
      <svg {...common}>
        <path d="M6 2v4.4" strokeLinecap="round" />
        <circle cx="6" cy="9.4" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="6" cy="6" r="3.2" />
    </svg>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-label font-medium ${TONE_CLASS[tone]}`}
    >
      <ToneIcon tone={tone} />
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <StatusPill tone={orderStatusTone(status)}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </StatusPill>
  );
}

export function PaymentStatusBadge({ status }: { status?: string | null }) {
  return (
    <StatusPill tone={paymentStatusTone(status)}>
      {paymentStatusLabel(status)}
    </StatusPill>
  );
}
