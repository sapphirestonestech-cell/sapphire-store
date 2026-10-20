import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { AdminUserModel } from "@/lib/models/settings";
import { clearSessionCookie, getSession } from "@/lib/session";

export interface AdminIdentity {
  id: string;
  email: string;
}

export type AdminAuth =
  | { ok: true; admin: AdminIdentity }
  | { ok: false; response: NextResponse };

function deny(error: string, status = 401) {
  return {
    ok: false as const,
    response: NextResponse.json({ error }, { status }),
  };
}

/** The signed-in admin, or null. Never throws: a lookup failure is "signed out". */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  try {
    const session = await getSession();
    if (!session || !mongoose.isValidObjectId(session.sub)) return null;

    await connectDb();
    const admin = await AdminUserModel.findById(session.sub)
      .select("email")
      .lean();
    if (!admin) return null;

    return { id: String(admin._id), email: admin.email };
  } catch {
    return null;
  }
}

/**
 * Gate an admin API route. A signed cookie alone is not enough: removing an
 * admin must end their access immediately, even though the cookie is
 * stateless and still inside its 8-hour lifetime. A stale cookie is cleared
 * so the browser stops sending a dead session.
 */
export async function requireAdmin(): Promise<AdminAuth> {
  const session = await getSession();
  if (!session) return deny("Sign in to continue.");

  if (!mongoose.isValidObjectId(session.sub)) {
    await clearSessionCookie();
    return deny("Your admin session has ended. Sign in again.");
  }

  try {
    await connectDb();
    const admin = await AdminUserModel.findById(session.sub)
      .select("email")
      .lean();
    if (!admin) {
      await clearSessionCookie();
      return deny("Your admin session has ended. Sign in again.");
    }
    return {
      ok: true,
      admin: { id: String(admin._id), email: admin.email },
    };
  } catch {
    return deny(
      "Admin access is unavailable right now. Try again shortly.",
      503,
    );
  }
}
