import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { DATA_SCOPE_COOKIE, parseDataScope } from "@/lib/admin/data-scope";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** POST /api/admin/data-scope — remember the Live/Test data choice. */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as { scope?: unknown };
  const scope = parseDataScope(body.scope);

  const res = NextResponse.json({ scope });
  res.cookies.set(DATA_SCOPE_COOKIE, scope, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return res;
}
