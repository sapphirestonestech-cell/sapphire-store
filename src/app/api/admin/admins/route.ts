import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import {
  AdminPayloadError,
  validateNewAdmin,
} from "@/lib/admin/admins";
import { AdminUserModel } from "@/lib/models/settings";

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

/** GET /api/admin/admins — every admin account, without password hashes. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await connectDb();
    const admins = await AdminUserModel.find()
      .sort({ createdAt: 1 })
      .select("email role lastLoginAt createdAt")
      .lean();
    return NextResponse.json({
      admins: admins.map((admin) => ({
        id: String(admin._id),
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt ?? null,
        createdAt: admin.createdAt ?? null,
      })),
      currentAdminId: auth.admin.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Admin accounts are unavailable right now." },
      { status: 503 },
    );
  }
}

/** POST /api/admin/admins — add another full admin (§6.1). */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const { email, password } = validateNewAdmin(body);
    await connectDb();
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await AdminUserModel.create({
      email,
      passwordHash,
      role: "admin",
    });
    return NextResponse.json(
      {
        admin: {
          id: String(admin._id),
          email: admin.email,
          role: admin.role,
          lastLoginAt: null,
          createdAt: admin.createdAt ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AdminPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (isDuplicateKey(error)) {
      return NextResponse.json(
        { error: "An admin already uses that email." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "The admin could not be added. Try again shortly." },
      { status: 503 },
    );
  }
}
