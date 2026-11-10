import { htmlToText } from "html-to-text";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface MarketingEmailParts {
  storeName: string;
  tagline: string;
  bodyHtml: string;
  unsubscribeUrl: string;
  isTest?: boolean;
}

export function buildMarketingEmail({
  storeName,
  tagline,
  bodyHtml,
  unsubscribeUrl,
  isTest = false,
}: MarketingEmailParts): { html: string; text: string } {
  const safeStore = escapeHtml(storeName);
  const safeTagline = escapeHtml(tagline);
  const safeUnsubscribe = escapeHtml(unsubscribeUrl);
  const testBanner = isTest
    ? `<div style="background:#FFF4D6;border:1px solid #E8C36A;border-radius:10px;padding:12px 16px;margin:0 0 20px;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#6B5318;">Test email — this is a preview, not a customer send.</div>`
    : "";

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeStore}</title>
    <style>
      img { max-width: 100% !important; height: auto !important; border: 0; }
      a { color: #8A6A1F; }
      @media only screen and (max-width: 600px) {
        .email-wrap { padding: 16px !important; }
        .email-card { padding: 24px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#FBF8F3;color:#211D19;">
    <div class="email-wrap" style="padding:32px 16px;">
      <div class="email-card" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#211D19;">
        <div style="margin:0 0 28px;padding:0 0 18px;border-bottom:1px solid #EEE6DA;">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.2;color:#211D19;">${safeStore}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#8A8178;">${safeTagline}</p>
        </div>
        ${testBanner}
        <div style="font-size:15px;line-height:1.65;">${bodyHtml}</div>
        <div style="margin:32px 0 0;padding:18px 0 0;border-top:1px solid #EEE6DA;font-size:12px;line-height:1.6;color:#8A8178;">
          <p style="margin:0 0 8px;">You received this email from ${safeStore} because you are a customer or have an account.</p>
          <p style="margin:0;"><a href="${safeUnsubscribe}" style="color:#8A6A1F;text-decoration:underline;">Unsubscribe from marketing emails</a></p>
        </div>
      </div>
    </div>
  </body>
</html>`;

  const text = `${storeName}\n${tagline}\n\n${htmlToText(bodyHtml, {
    wordwrap: 80,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
    ],
  })}\n\nYou received this email from ${storeName} because you are a customer or have an account.\nUnsubscribe: ${unsubscribeUrl}\n`;

  return { html, text };
}
