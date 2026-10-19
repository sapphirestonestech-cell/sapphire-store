import { NextResponse } from "next/server";
import { resetPassword, AccountError } from "@/lib/customers";

/**
 * POST /api/auth/reset-password — consume a reset token and set the new
 * password. Tokens are single-use and expire after one hour.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const payload = (body ?? {}) as Record<string, unknown>;
  try {
    await resetPassword({ token: payload.token, password: payload.password });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AccountError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "We couldn't reset the password. Try again shortly." },
      { status: 500 },
    );
  }
}
