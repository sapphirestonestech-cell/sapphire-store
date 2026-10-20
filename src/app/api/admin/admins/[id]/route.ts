import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { canRemoveAdmin } from "@/lib/admin/admins";
import { AdminUserModel } from "@/lib/models/settings";

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/admin/admins/:id — remove an admin, never yourself or the last one. */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  }

  try {
    await connectDb();
    const target = await AdminUserModel.findById(id).select("_id").lean();
    if (!target) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    const count = await AdminUserModel.countDocuments();
    const guard = canRemoveAdmin(String(target._id), auth.admin.id, count);
    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason }, { status: 400 });
    }

    await AdminUserModel.deleteOne({ _id: target._id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The admin could not be removed. Try again shortly." },
      { status: 503 },
    );
  }
}
