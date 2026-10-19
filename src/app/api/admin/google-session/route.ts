import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { AdminUserModel } from "@/lib/models/settings";
import { setSessionCookie } from "@/lib/session";

/**
 * GET /api/admin/google-session — landing point after "Continue with
 * Google" on the admin login page (ProductReq.md §6.1). The Google session
 * is verified server-side; the admin HMAC cookie is only minted when the
 * signed-in email matches an AdminUser record. Any other email is refused
 * and sent back to the login page with an explanation.
 */
export async function GET(request: NextRequest) {
  let isAdmin = false;
  try {
    const session = await auth();
    const email = session?.user?.email?.trim().toLowerCase();
    if (email) {
      await connectDb();
      const admin = await AdminUserModel.findOne({ email })
        .select("_id")
        .lean();
      if (admin) {
        await AdminUserModel.updateOne(
          { _id: admin._id },
          { $set: { lastLoginAt: new Date() } },
        );
        await setSessionCookie(String(admin._id));
        isAdmin = true;
      }
    }
  } catch {
    // Fall through to the refusal below — never mint a cookie on error.
  }
  if (!isAdmin) {
    return NextResponse.redirect(
      new URL("/admin/login?error=not-admin", request.url),
    );
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}
