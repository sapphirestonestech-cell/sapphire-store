import { connection } from "next/server";
import { connectDb } from "@/lib/db";
import { getAdminIdentity } from "@/lib/admin/auth";
import { AdminUserModel } from "@/lib/models/settings";
import { AdminsManager, type AdminRow } from "@/components/admin/admins-manager";

async function loadAdmins(): Promise<{
  failed: boolean;
  rows: AdminRow[];
  currentAdminId: string;
}> {
  try {
    await connection();
    const admin = await getAdminIdentity();
    if (!admin) return { failed: true, rows: [], currentAdminId: "" };

    await connectDb();
    const docs = await AdminUserModel.find()
      .sort({ createdAt: 1 })
      .select("email role lastLoginAt createdAt")
      .lean();
    return {
      failed: false,
      currentAdminId: admin.id,
      rows: docs.map((doc) => ({
        id: String(doc._id),
        email: doc.email,
        role: doc.role,
        lastLoginAt: doc.lastLoginAt?.toISOString() ?? null,
        createdAt: doc.createdAt?.toISOString() ?? null,
      })),
    };
  } catch {
    return { failed: true, rows: [], currentAdminId: "" };
  }
}

export async function AdminsSettings() {
  const { failed, rows, currentAdminId } = await loadAdmins();

  return (
    <div className="space-y-6">
      <p className="text-body text-muted">
        People who can sign in to this back office. Every admin has full access
        to the store.
      </p>

      {failed ? (
        <div
          role="alert"
          className="rounded-md border border-danger/40 bg-card p-6 shadow-card"
        >
          <p className="text-body text-danger">
            We couldn&apos;t load admin accounts. Check MONGODB_URI in
            .env.local, then refresh.
          </p>
        </div>
      ) : (
        <AdminsManager initial={rows} currentAdminId={currentAdminId} />
      )}
    </div>
  );
}
