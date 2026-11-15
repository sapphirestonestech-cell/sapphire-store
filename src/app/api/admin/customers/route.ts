import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { listCustomers } from "@/lib/admin/customer-access";

/** GET /api/admin/customers — storefront accounts with back-office status. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const customers = await listCustomers();
    return NextResponse.json({
      customers,
      currentAdminId: auth.admin.id,
      currentAdminEmail: auth.admin.email,
    });
  } catch {
    return NextResponse.json(
      { error: "Customers are unavailable right now." },
      { status: 503 },
    );
  }
}
