import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import {
  CustomerAccessError,
  grantCustomerAdmin,
  revokeCustomerAdmin,
} from "@/lib/admin/customer-access";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/customers/:id — grant or revoke back-office access.
 * The storefront account is never changed or deleted.
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { admin?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.admin !== "boolean") {
    return NextResponse.json(
      { error: "Choose whether to grant or revoke admin access." },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    if (body.admin) {
      const admin = await grantCustomerAdmin(id);
      return NextResponse.json({ ok: true, admin });
    }
    await revokeCustomerAdmin(id, auth.admin.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CustomerAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Back-office access could not be updated. Try again." },
      { status: 503 },
    );
  }
}
