import { NextResponse } from "next/server";
import { requestPasswordReset, AccountError } from "@/lib/customers";
import { checkLoginAllowed, recordFailedLogin } from "@/lib/rate-limit";

/**
 * POST /api/auth/forgot-password — start a password reset. The response is
 * always the same success message so accounts cannot be enumerated. Sending
 * is rate-limited per email to prevent abuse.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = String((body as Record<string, unknown>)?.email ?? "")
    .trim()
    .toLowerCase();

  const limitKey = `password-reset:${email}`;
  const allowed = checkLoginAllowed(limitKey);
  if (!allowed.allowed) {
    return NextResponse.json(
      { error: "Too many reset requests. Try again later." },
      { status: 429 },
    );
  }

  try {
    await requestPasswordReset(email);
    recordFailedLogin(limitKey); // reuse the counter to throttle repeat sends
    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, we've sent a link to reset the password.",
    });
  } catch (err) {
    if (err instanceof AccountError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "We couldn't send the reset email. Try again shortly." },
      { status: 500 },
    );
  }
}
