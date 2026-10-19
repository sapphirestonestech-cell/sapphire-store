import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateCustomerProfile, AccountError } from "@/lib/customers";
import { connectDb } from "@/lib/db";
import { CustomerModel } from "@/lib/models/customer";
import { toPublicCustomer } from "@/lib/customers";

/** GET /api/account/profile — the signed-in customer's profile. */
export async function GET() {
  const session = await auth();
  const id = session?.user?.customerId;
  if (!id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  try {
    await connectDb();
    const doc = await CustomerModel.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    return NextResponse.json({ customer: toPublicCustomer(doc) });
  } catch {
    return NextResponse.json(
      { error: "We couldn't load your profile. Try again shortly." },
      { status: 500 },
    );
  }
}

/** PATCH /api/account/profile — update name, phone or preferred currency. */
export async function PATCH(request: Request) {
  const session = await auth();
  const id = session?.user?.customerId;
  if (!id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const payload = (body ?? {}) as Record<string, unknown>;
  try {
    const customer = await updateCustomerProfile(id, {
      name: payload.name,
      phone: payload.phone,
      preferredCurrency: payload.preferredCurrency,
    });
    return NextResponse.json({ customer });
  } catch (err) {
    if (err instanceof AccountError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "We couldn't save your profile. Try again shortly." },
      { status: 500 },
    );
  }
}
