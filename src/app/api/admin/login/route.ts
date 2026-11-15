import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { AdminUserModel } from "@/lib/models/settings";
import {
  checkLoginAllowed,
  recordFailedLogin,
  clearLoginAttempts,
} from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session";

/**
 * POST /api/admin/login — email + password with rate limiting and
 * lockout (ProductReq.md §6.1).
 */
export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  const limitKey = `login:${email}`;
  const allowed = checkLoginAllowed(limitKey);
  if (!allowed.allowed) {
    const minutes = Math.ceil((allowed.retryAfterMs ?? 0) / 60000);
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      },
      { status: 429 },
    );
  }

  try {
    await connectDb();
    const user = await AdminUserModel.findOne({ email }).lean();

    // A promoted Google-only customer has no password to compare. Say so
    // rather than a bare "incorrect" so they take the Google route.
    if (user && !user.passwordHash) {
      return NextResponse.json(
        {
          error:
            "This account signs in with Google. Choose Continue with Google.",
        },
        { status: 401 },
      );
    }

    const hash = user?.passwordHash;
    const ok =
      hash != null &&
      (await bcrypt.compare(password, hash));

    if (!ok) {
      recordFailedLogin(limitKey);
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    clearLoginAttempts(limitKey);
    await AdminUserModel.updateOne(
      { _id: user!._id },
      { $set: { lastLoginAt: new Date() } },
    );
    await setSessionCookie(String(user!._id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Sign-in is unavailable right now. Try again shortly." },
      { status: 503 },
    );
  }
}
