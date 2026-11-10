import { NextResponse } from "next/server";
import { suppressEmail, verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

/**
 * Accepts the footer form and the RFC 8058 one-click POST from mailbox
 * providers. The signed token is the only credential, so no CSRF token is
 * needed.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let form: FormData | null = null;
  try {
    form = await request.formData();
  } catch {
    form = null;
  }

  const formToken = form?.get("token");
  const token =
    (typeof formToken === "string" && formToken) ||
    url.searchParams.get("token") ||
    "";
  const email = verifyUnsubscribeToken(token);

  if (!email) {
    return NextResponse.json(
      { error: "This unsubscribe link is invalid or has expired." },
      { status: 400 },
    );
  }

  await suppressEmail(email, url.searchParams.get("campaign") ?? undefined);

  if (formToken) {
    const redirect = new URL("/unsubscribe", url);
    redirect.searchParams.set("token", token);
    redirect.searchParams.set("done", "1");
    return NextResponse.redirect(redirect, 303);
  }

  return new NextResponse("Unsubscribed", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
