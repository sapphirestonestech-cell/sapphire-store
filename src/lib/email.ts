import nodemailer from "nodemailer";
import { BRAND_NAME, TAGLINE } from "@/lib/tagline";
import { fromMinor, toMinor } from "@/lib/checkout";
import { priceIn } from "@/lib/currency";

/**
 * Transactional email — Gmail SMTP when GMAIL_USER and GMAIL_APP_PASSWORD are
 * set (free tier; uses an App Password, not the account password). In
 * development without credentials, emails are logged to the server console so
 * flows stay testable locally (reset links are visible in the terminal).
 */

const FROM =
  process.env.EMAIL_FROM ??
  (process.env.GMAIL_USER
    ? `${BRAND_NAME} <${process.env.GMAIL_USER}>`
    : `${BRAND_NAME} <no-reply@localhost>`);

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#FBF8F3;font-family:Georgia,serif;color:#211D19;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="font-size:22px;margin:0 0 4px;">${BRAND_NAME}</p>
      <p style="font-size:13px;color:#8A8178;margin:0 0 24px;">${TAGLINE}</p>
      <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;">${title}</h1>
      ${bodyHtml}
    </div>
  </body>
</html>`;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      // Reuse authenticated connections — a fresh Gmail handshake costs ~4.5s.
      pool: true,
      maxConnections: 1,
      // Fail fast instead of stalling sign-up for minutes on a bad connection.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

async function send(
  to: string,
  subject: string,
  text: string,
  html: string,
  logLabel: string,
  headers?: Record<string, string>,
): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.info(
      `[email] GMAIL_USER/GMAIL_APP_PASSWORD not set — ${logLabel} for ${to}\n[email] ${text.replace(/\n/g, "\n[email] ")}`,
    );
    return;
  }
  await getTransporter().sendMail({
    from: FROM,
    to,
    subject,
    text,
    html,
    headers,
  });
  console.info(`[email] ${logLabel} sent to ${to}`);
}

/**
 * Welcome email — sent the moment an account is created (sign-up or first
 * Google sign-in). Delivery failure is logged but never thrown: a welcome
 * email must not break account creation.
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<void> {
  const subject = `Welcome to ${BRAND_NAME}`;
  const text = `Hi ${name},\n\nYour ${BRAND_NAME} account is ready — sign in any time to track orders, save addresses and keep your currency preference.\n\n${TAGLINE}`;
  const html = shell(
    `Welcome, ${name}`,
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Your ${BRAND_NAME} account is ready — sign in any time to track orders, save addresses and keep your currency preference.</p>
     <a href="${process.env.APP_URL ?? "http://localhost:3000"}/sign-in" style="display:inline-block;background:#C9A24B;color:#211D19;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:999px;">Sign in</a>
     <p style="font-size:13px;color:#8A8178;line-height:1.6;margin:20px 0 0;">${TAGLINE}</p>`,
  );
  try {
    await send(email, subject, text, html, "welcome email");
  } catch (err) {
    console.error(
      `[email] welcome email to ${email} failed: ${err instanceof Error ? err.message : err}`,
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  const subject = `Reset your ${BRAND_NAME} password`;
  const text = `Someone asked to reset the password for this ${BRAND_NAME} account.\n\nOpen this link within the next hour to choose a new password:\n${resetUrl}\n\nIf you didn't request this, you can ignore this email — your password stays unchanged.`;
  const html = shell(
    "Reset your password",
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Someone asked to reset the password for this ${BRAND_NAME} account. This link works once and expires in one hour.</p>
     <a href="${resetUrl}" style="display:inline-block;background:#C9A24B;color:#211D19;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:999px;">Choose a new password</a>
     <p style="font-size:13px;color:#8A8178;line-height:1.6;margin:20px 0 0;">If you didn't request this, you can ignore this email — your password stays unchanged.</p>`,
  );

  await send(email, subject, text, html, `password reset link ${resetUrl}`);
}

/** Currency-aware money formatting for the transactional emails. */
export function formatEmailMoney(
  minor: number,
  currency: "USD" | "NGN",
): string {
  const symbol = currency === "NGN" ? "₦" : "$";
  const major = minor / 100;
  // Naira is normally whole; keep kobo visible when an amount has them.
  const showFraction = currency === "USD" || minor % 100 !== 0;
  return `${symbol}${major.toLocaleString(
    currency === "NGN" ? "en-NG" : "en-US",
    {
      minimumFractionDigits: showFraction ? 2 : 0,
      maximumFractionDigits: showFraction ? 2 : 0,
    },
  )}`;
}

interface OrderEmailItem {
  name: string;
  sizeLabel: string;
  quantity: number;
  availability: "in_stock" | "pre_order";
  preorderArrivalDate?: Date | null;
  unitPriceMinor: number;
  lineTotalMinor: number;
  dueNowMinor: number;
  dueLaterMinor: number;
  paymentMode?: "full" | "deposit";
  depositPercent?: number;
}

/**
 * The exact payment figure. `paymentAmountMinor` is what was sent to the
 * gateway at initialize, in `paymentCurrency`; older rows fall back to the
 * items due now in the order's display currency. Emails use this — never a
 * recomputation from `totalMinor` — so the receipt always matches the
 * gateway (DECISIONS 2026-11-16).
 */
export function paidAmount(order: {
  paymentAmountMinor?: number | null;
  paymentCurrency?: "USD" | "NGN" | null;
  amountDueNowMinor: number;
  currency: "USD" | "NGN";
}): { minor: number; currency: "USD" | "NGN" } {
  return {
    minor: order.paymentAmountMinor ?? order.amountDueNowMinor,
    currency: order.paymentCurrency ?? order.currency,
  };
}

/**
 * Format a base-currency `*Minor` value in the currency the customer browsed
 * in, at the rate frozen on the order — the same conversion the order page
 * uses. Order fields are always stored in `baseCurrency`, so printing them
 * with the display currency's symbol (the old behaviour) could be wrong by
 * the whole exchange rate.
 */
export function displayMoney(
  minor: number,
  order: {
    baseCurrency: "USD" | "NGN";
    currency: "USD" | "NGN";
    exchangeRate: number;
  },
): string {
  return formatEmailMoney(
    toMinor(
      priceIn(
        fromMinor(minor),
        order.baseCurrency,
        order.currency,
        order.exchangeRate,
      ),
    ),
    order.currency,
  );
}

/**
 * Order confirmation email — sent after payment is verified (ProductReq.md
 * §11.2). Shows order number, item lines with quantity/size, delivery to
 * location, and **the amount actually charged** in the currency the gateway
 * charged it in, plus any pre-order balance. Failure is logged but never
 * thrown: payment verification must not roll back because an email failed.
 */
export async function sendOrderConfirmationEmail(
  email: string,
  order: {
    orderNumber: string;
    customer: { name: string };
    currency: "USD" | "NGN";
    baseCurrency: "USD" | "NGN";
    exchangeRate: number;
    items: OrderEmailItem[];
    location: {
      cityArea: string;
      region?: string;
      country: string;
    };
    subtotalMinor: number;
    totalMinor: number;
    amountDueNowMinor: number;
    amountDueLaterMinor: number;
    paymentAmountMinor?: number | null;
    paymentCurrency?: "USD" | "NGN" | null;
    paymentGateway?: "paystack" | "bachs";
    paymentReference?: string;
    shipments?: {
      kind: "in_stock" | "pre_order";
      minDays: number;
      maxDays: number;
      arrivalDate?: Date | null;
    }[];
    createdAt: Date;
  },
): Promise<void> {
  const fmt = formatEmailMoney;
  const display = (minor: number) => displayMoney(minor, order);
  const charged = paidAmount(order);
  const converted = charged.currency !== order.currency;
  const gateway = order.paymentGateway
    ? order.paymentGateway === "paystack"
      ? "Paystack"
      : "BACHS"
    : null;

  const subject = `Order ${order.orderNumber} confirmed — ${BRAND_NAME}`;
  const dateStr = order.createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const itemRows = order.items
    .map((item) => {
      const arrival =
        item.availability === "pre_order" && item.preorderArrivalDate
          ? `<br/><span style="color:#8A8178;font-size:13px;">Arriving ${new Date(item.preorderArrivalDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>`
          : "";
      const deposit =
        item.paymentMode === "deposit" && item.dueLaterMinor > 0
          ? `<br/><span style="color:#8A8178;font-size:13px;">${item.depositPercent ?? 0}% deposit · ${display(item.dueNowMinor)} now, ${display(item.dueLaterMinor)} before shipping</span>`
          : "";
      return `<li style="padding:8px 0;border-bottom:1px solid #EEE6DA;">
        <span style="font-weight:600;">${escapeHtml(item.name)}</span>
        <span style="color:#8A8178;"> · Size ${escapeHtml(item.sizeLabel)} · Qty ${item.quantity}${item.availability === "pre_order" ? " · Pre-order" : ""} · ${display(item.lineTotalMinor)}</span>${arrival}${deposit}
      </li>`;
    })
    .join("");

  const textLines = order.items
    .map(
      (i) =>
        `  ${i.name} — Size ${i.sizeLabel} × ${i.quantity}${i.availability === "pre_order" ? " (Pre-order)" : ""} — ${display(i.lineTotalMinor)}`,
    )
    .join("\n");

  const balance =
    order.amountDueLaterMinor > 0
      ? `\nBalance due before shipping: ${display(order.amountDueLaterMinor)}`
      : "";
  const balanceHtml =
    order.amountDueLaterMinor > 0
      ? `<p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Balance due before shipping: ${display(order.amountDueLaterMinor)}</p>`
      : "";
  const conversionNote = converted
    ? `\nCharged in ${charged.currency === "NGN" ? "naira" : "US dollars"} at the rate locked on your order.`
    : "";
  const conversionHtml = converted
    ? `<p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Charged in ${charged.currency === "NGN" ? "naira" : "US dollars"} at the rate locked on your order.</p>`
    : "";
  const reference = order.paymentReference
    ? `\nReference: ${order.paymentReference}`
    : "";
  const referenceHtml = order.paymentReference
    ? `<p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Reference: ${escapeHtml(order.paymentReference)}</p>`
    : "";
  const estimate =
    order.shipments && order.shipments.length > 0
      ? order.shipments
          .map(
            (s) =>
              `${s.kind === "in_stock" ? "In-stock" : "Pre-order"} ${s.minDays}–${s.maxDays} days`,
          )
          .join(" · ")
      : null;

  const text = `Hi ${order.customer.name},\n\nYour payment for order ${order.orderNumber} has been verified and your order is confirmed.\n\nItems:\n${textLines}\n\nItems total: ${display(order.subtotalMinor)}\nPaid now: ${fmt(charged.minor, charged.currency)}${conversionNote}${balance}\nDelivery to: ${order.location.cityArea}${order.location.region ? `, ${order.location.region}` : ""}, ${order.location.country}${estimate ? ` (${estimate})` : ""}\n${gateway ? `Paid with: ${gateway}${reference}\n` : ""}\nPlaced: ${dateStr}\n\n${TAGLINE}`;

  const html = shell(
    `Order ${order.orderNumber} confirmed`,
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Hi ${escapeHtml(order.customer.name)}, your payment has been verified and your order is confirmed.</p>
     <ul style="list-style:none;padding:0;margin:0 0 20px;">${itemRows}</ul>
     <p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Items total: ${display(order.subtotalMinor)}</p>
     <p style="font-size:16px;font-weight:600;margin:0 0 4px;">Paid now: ${fmt(charged.minor, charged.currency)}</p>
     ${conversionHtml}
     ${balanceHtml}
     <p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Delivery to: ${escapeHtml(order.location.cityArea)}${order.location.region ? `, ${escapeHtml(order.location.region)}` : ""}, ${escapeHtml(order.location.country)}${estimate ? ` · ${escapeHtml(estimate)}` : ""}</p>
     ${gateway ? `<p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Paid with ${gateway}</p>` : ""}
     ${referenceHtml}
     <p style="font-size:13px;color:#8A8178;margin:0 0 20px;">Order ${escapeHtml(order.orderNumber)} · ${dateStr}</p>
     <p style="font-size:13px;color:#8A8178;line-height:1.6;margin:0;">${TAGLINE}</p>`,
  );

  try {
    await send(email, subject, text, html, `order confirmation ${order.orderNumber}`);
  } catch (err) {
    console.error(
      `[email] order confirmation to ${email} failed: ${err instanceof Error ? err.message : err}`,
    );
  }
}

/**
 * New paid-order alert for the store admins — ProductReq.md §11.3. Sent after
 * a payment is verified, once per admin. Reports the exact charged amount and
 * currency, the item total, any pre-order balance, and the recorded delivery
 * fee (which is not collected online). Delivery failure is logged per
 * recipient and never thrown: fulfilment must not depend on email.
 */
export async function sendAdminNewOrderEmail(
  recipients: string[],
  order: {
    id: string;
    orderNumber: string;
    customer: { name: string; email: string; phone: string };
    currency: "USD" | "NGN";
    baseCurrency: "USD" | "NGN";
    exchangeRate: number;
    items: OrderEmailItem[];
    location: { cityArea: string; region?: string; country: string };
    subtotalMinor: number;
    totalMinor: number;
    amountDueNowMinor: number;
    amountDueLaterMinor: number;
    deliveryTotalMinor?: number;
    paymentAmountMinor?: number | null;
    paymentCurrency?: "USD" | "NGN" | null;
    paymentGateway?: "paystack" | "bachs";
    paymentReference?: string;
    shipments?: {
      kind: "in_stock" | "pre_order";
      minDays: number;
      maxDays: number;
      arrivalDate?: Date | null;
    }[];
    createdAt: Date;
  },
): Promise<void> {
  if (recipients.length === 0) return;

  const fmt = formatEmailMoney;
  const display = (minor: number) => displayMoney(minor, order);
  const charged = paidAmount(order);
  const converted = charged.currency !== order.currency;
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const orderUrl = `${base}/admin/orders/${order.id}`;
  const gateway = order.paymentGateway
    ? order.paymentGateway === "paystack"
      ? "Paystack"
      : "BACHS"
    : "Gateway";
  const dateStr = order.createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const itemRows = order.items
    .map(
      (item) =>
        `<li style="padding:8px 0;border-bottom:1px solid #EEE6DA;">
          <span style="font-weight:600;">${escapeHtml(item.name)}</span>
          <span style="color:#8A8178;"> · Size ${escapeHtml(item.sizeLabel)} · Qty ${item.quantity}${item.availability === "pre_order" ? " · Pre-order" : ""} · ${display(item.lineTotalMinor)}</span>
        </li>`,
    )
    .join("");

  const textLines = order.items
    .map(
      (item) =>
        `  ${item.name} — Size ${item.sizeLabel} × ${item.quantity}${item.availability === "pre_order" ? " (Pre-order)" : ""} — ${display(item.lineTotalMinor)}`,
    )
    .join("\n");

  const conversionNote = converted
    ? `\nCharged in ${charged.currency === "NGN" ? "naira" : "US dollars"} at the order's frozen rate.`
    : "";
  const conversionHtml = converted
    ? `<p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Charged in ${charged.currency === "NGN" ? "naira" : "US dollars"} at the order's frozen rate.</p>`
    : "";
  const dueLater =
    order.amountDueLaterMinor > 0
      ? `\nBalance due before shipping: ${display(order.amountDueLaterMinor)}`
      : "";
  const dueLaterHtml =
    order.amountDueLaterMinor > 0
      ? `<p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Balance due before shipping: ${display(order.amountDueLaterMinor)}</p>`
      : "";
  const deliveryFee =
    (order.deliveryTotalMinor ?? 0) > 0
      ? `\nDelivery fee recorded (not charged online): ${display(order.deliveryTotalMinor ?? 0)}`
      : "";
  const deliveryFeeHtml =
    (order.deliveryTotalMinor ?? 0) > 0
      ? `<p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Delivery fee recorded (not charged online): ${display(order.deliveryTotalMinor ?? 0)}</p>`
      : "";
  const reference = order.paymentReference
    ? `\nReference: ${order.paymentReference}`
    : "";
  const referenceHtml = order.paymentReference
    ? `<p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Reference: ${escapeHtml(order.paymentReference)}</p>`
    : "";
  const estimate =
    order.shipments && order.shipments.length > 0
      ? order.shipments
          .map(
            (s) =>
              `${s.kind === "in_stock" ? "In-stock" : "Pre-order"} ${s.minDays}–${s.maxDays} days`,
          )
          .join(" · ")
      : null;

  const text = `New paid order ${order.orderNumber}.\n\nCustomer: ${order.customer.name}\nEmail: ${order.customer.email}\nPhone: ${order.customer.phone}\n\nItems:\n${textLines}\n\nItems total: ${display(order.subtotalMinor)}\nPaid now: ${fmt(charged.minor, charged.currency)}${conversionNote}${dueLater}${deliveryFee}\nPaid with: ${gateway}${reference}\nDelivery to: ${order.location.cityArea}${order.location.region ? `, ${order.location.region}` : ""}, ${order.location.country}${estimate ? ` (${estimate})` : ""}\nPlaced: ${dateStr}\n\nOpen the order: ${orderUrl}`;

  const html = shell(
    `New paid order ${escapeHtml(order.orderNumber)}`,
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">A customer has paid. Prepare the order.</p>
     <p style="font-size:15px;line-height:1.6;margin:0 0 4px;"><strong>${escapeHtml(order.customer.name)}</strong></p>
     <p style="font-size:13px;color:#8A8178;margin:0 0 2px;">${escapeHtml(order.customer.email)}</p>
     <p style="font-size:13px;color:#8A8178;margin:0 0 20px;">${escapeHtml(order.customer.phone)}</p>
     <ul style="list-style:none;padding:0;margin:0 0 20px;">${itemRows}</ul>
     <p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Items total: ${display(order.subtotalMinor)}</p>
     <p style="font-size:16px;font-weight:600;margin:0 0 4px;">Paid now: ${fmt(charged.minor, charged.currency)}</p>
     ${conversionHtml}
     ${dueLaterHtml}
     ${deliveryFeeHtml}
     <p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Paid with ${gateway}${order.paymentReference ? ` · ${escapeHtml(order.paymentReference)}` : ""}</p>
     ${referenceHtml}
     <p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Delivery to: ${escapeHtml(order.location.cityArea)}${order.location.region ? `, ${escapeHtml(order.location.region)}` : ""}, ${escapeHtml(order.location.country)}${estimate ? ` · ${escapeHtml(estimate)}` : ""}</p>
     <p style="font-size:13px;color:#8A8178;margin:0 0 20px;">Order ${escapeHtml(order.orderNumber)} · ${dateStr}</p>
     <a href="${orderUrl}" style="display:inline-block;background:#C9A24B;color:#211D19;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:999px;">Open in back office</a>
     <p style="font-size:13px;color:#8A8178;line-height:1.6;margin:20px 0 0;">${TAGLINE}</p>`,
  );

  const subject = `New paid order ${order.orderNumber} — ${BRAND_NAME}`;

  for (const email of recipients) {
    try {
      await send(
        email,
        subject,
        text,
        html,
        `new-order alert ${order.orderNumber}`,
      );
    } catch (err) {
      console.error(
        `[email] new-order alert to ${email} failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}

/**
 * Marketing email — sent through the same Gmail SMTP account, but with the
 * unsubscribe headers required by mailbox providers. The body is already
 * sanitized and wrapped by `buildMarketingEmail`.
 */
export async function sendMarketingEmail(
  email: string,
  subject: string,
  text: string,
  html: string,
  unsubscribeUrl: string,
  isTest = false,
): Promise<void> {
  const headers = isTest
    ? undefined
    : {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        Precedence: "bulk",
      };
  await send(
    email,
    subject,
    text,
    html,
    isTest ? "marketing test email" : "marketing email",
    headers,
  );
}
