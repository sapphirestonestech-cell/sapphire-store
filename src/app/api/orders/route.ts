import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { placeOrder, OrderError } from "@/lib/orders";

/**
 * POST /api/orders — ProductReq.md §10, §14.2. Recomputes the order from
 * the database (never trusts the client's prices), freezes it, and returns
 * the order number. The signed-in customer id is taken from the session,
 * never from the request body. Payment is verified separately (later phase).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const session = await auth();
  const customerId = session?.user?.customerId;

  const payload = (body ?? {}) as Record<string, unknown>;
  try {
    const order = await placeOrder({
      items: payload.items,
      customer: payload.customer,
      locationId: payload.locationId,
      currency: payload.currency,
      customerId,
    });
    return NextResponse.json(
      { orderNumber: order.orderNumber },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "We couldn't place your order. Please try again." },
      { status: 500 },
    );
  }
}
