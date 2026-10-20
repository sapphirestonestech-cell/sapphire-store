import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { OrderModel } from "@/lib/models/order";
import { verifyOrderPayment } from "@/lib/payments/verify";

/**
 * POST /api/admin/payments/[reference]/verify — reconcile a stuck payment
 * (§6.8, §10.7). Uses the same exact amount/currency rules as the webhook
 * and the return-page poll.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { reference } = await params;

  try {
    await connectDb();
    const order = await OrderModel.findOne({ paymentReference: reference });
    if (!order) {
      return NextResponse.json(
        { error: "No order uses that payment reference." },
        { status: 404 },
      );
    }

    const result = await verifyOrderPayment(order);

    revalidatePath("/admin/payments");
    revalidatePath(`/admin/payments/${reference}`);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${String(order._id)}`);

    return NextResponse.json({
      verified: result.verified,
      message: result.message,
      status: order.status,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not verify the payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
