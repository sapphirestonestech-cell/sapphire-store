import nodemailer from "nodemailer";

/**
 * Transactional email — Gmail SMTP when GMAIL_USER and GMAIL_APP_PASSWORD are
 * set (free tier; uses an App Password, not the account password). In
 * development without credentials, emails are logged to the server console so
 * flows stay testable locally (reset links are visible in the terminal).
 */

const FROM =
  process.env.EMAIL_FROM ??
  (process.env.GMAIL_USER
    ? `Sapphire <${process.env.GMAIL_USER}>`
    : "Sapphire <no-reply@localhost>");

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#FBF8F3;font-family:Georgia,serif;color:#211D19;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="font-size:22px;margin:0 0 4px;">Sapphire</p>
      <p style="font-size:13px;color:#8A8178;margin:0 0 24px;">Luxurious rings at an affordable price.</p>
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
): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.info(
      `[email] GMAIL_USER/GMAIL_APP_PASSWORD not set — ${logLabel} for ${to}\n[email] ${text.replace(/\n/g, "\n[email] ")}`,
    );
    return;
  }
  await getTransporter().sendMail({ from: FROM, to, subject, text, html });
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
  const subject = "Welcome to Sapphire";
  const text = `Hi ${name},\n\nYour Sapphire account is ready — sign in any time to track orders, save addresses and keep your currency preference.\n\nLuxurious rings at an affordable price.`;
  const html = shell(
    `Welcome, ${name}`,
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Your Sapphire account is ready — sign in any time to track orders, save addresses and keep your currency preference.</p>
     <a href="${process.env.APP_URL ?? "http://localhost:3000"}/sign-in" style="display:inline-block;background:#C9A24B;color:#211D19;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:999px;">Sign in</a>
     <p style="font-size:13px;color:#8A8178;line-height:1.6;margin:20px 0 0;">Luxurious rings at an affordable price.</p>`,
  );
  try {
    await send(email, subject, text, html, "welcome email");
  } catch (err) {
    console.error(
      `[email] welcome email to ${email} failed: ${err instanceof Error ? err.message : err}`,
    );
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  const subject = "Reset your Sapphire password";
  const text = `Someone asked to reset the password for this Sapphire account.\n\nOpen this link within the next hour to choose a new password:\n${resetUrl}\n\nIf you didn't request this, you can ignore this email — your password stays unchanged.`;
  const html = shell(
    "Reset your password",
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Someone asked to reset the password for this Sapphire account. This link works once and expires in one hour.</p>
     <a href="${resetUrl}" style="display:inline-block;background:#C9A24B;color:#211D19;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:999px;">Choose a new password</a>
     <p style="font-size:13px;color:#8A8178;line-height:1.6;margin:20px 0 0;">If you didn't request this, you can ignore this email — your password stays unchanged.</p>`,
  );

  await send(email, subject, text, html, `password reset link ${resetUrl}`);
}

/**
 * Order confirmation email — sent after payment is verified (ProductReq.md
 * §11.2). Shows order number, item lines with quantity/size, delivery to
 * location, and the total charged. Failure is logged but never thrown:
 * payment verification must not roll back because an email failed.
 */
export async function sendOrderConfirmationEmail(
  email: string,
  order: {
    orderNumber: string;
    customer: { name: string };
    currency: "USD" | "NGN";
    items: {
      name: string;
      sizeLabel: string;
      quantity: number;
      availability: "in_stock" | "pre_order";
      preorderArrivalDate?: Date | null;
    }[];
    location: {
      cityArea: string;
      region?: string;
      country: string;
    };
    totalMinor: number;
    createdAt: Date;
  },
): Promise<void> {
  const fmtMinor = (minor: number): string => {
    const symbol = order.currency === "NGN" ? "₦" : "$";
    const major = minor / 100;
    if (order.currency === "NGN") {
      return `${symbol}${major.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `${symbol}${major.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const subject = `Order ${order.orderNumber} confirmed — Sapphire`;
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
      return `<li style="padding:8px 0;border-bottom:1px solid #EEE6DA;">
        <span style="font-weight:600;">${item.name}</span>
        <span style="color:#8A8178;"> · Size ${item.sizeLabel} · Qty ${item.quantity}${item.availability === "pre_order" ? " · Pre-order" : ""}</span>${arrival}
      </li>`;
    })
    .join("");

  const textLines = order.items
    .map(
      (i) =>
        `  ${i.name} — Size ${i.sizeLabel} × ${i.quantity}${i.availability === "pre_order" ? " (Pre-order)" : ""}`,
    )
    .join("\n");

  const text = `Hi ${order.customer.name},\n\nYour payment for order ${order.orderNumber} has been verified and your order is confirmed.\n\nItems:\n${textLines}\n\nTotal: ${fmtMinor(order.totalMinor)}\nDelivery to: ${order.location.cityArea}${order.location.region ? `, ${order.location.region}` : ""}, ${order.location.country}\n\nPlaced: ${dateStr}\n\nLuxurious rings at an affordable price.`;

  const html = shell(
    `Order ${order.orderNumber} confirmed`,
    `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Hi ${order.customer.name}, your payment has been verified and your order is confirmed.</p>
     <ul style="list-style:none;padding:0;margin:0 0 20px;">${itemRows}</ul>
     <p style="font-size:16px;font-weight:600;margin:0 0 4px;">Total: ${fmtMinor(order.totalMinor)}</p>
     <p style="font-size:13px;color:#8A8178;margin:0 0 4px;">Delivery to: ${order.location.cityArea}${order.location.region ? `, ${order.location.region}` : ""}, ${order.location.country}</p>
     <p style="font-size:13px;color:#8A8178;margin:0 0 20px;">Order ${order.orderNumber} · ${dateStr}</p>
     <p style="font-size:13px;color:#8A8178;line-height:1.6;margin:0;">Luxurious rings at an affordable price.</p>`,
  );

  try {
    await send(email, subject, text, html, `order confirmation ${order.orderNumber}`);
  } catch (err) {
    console.error(
      `[email] order confirmation to ${email} failed: ${err instanceof Error ? err.message : err}`,
    );
  }
}
