import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import {
  cancelOrder,
  OrderAdminError,
  refundOrder,
  setAdminNotes,
  updateOrderStatus,
} from "@/lib/admin/orders";
import { ORDER_STATUSES } from "@/lib/admin/orders";
import type { OrderStatus } from "@/lib/models/order";

interface Body {
  action?: unknown;
  status?: unknown;
  note?: unknown;
  notes?: unknown;
}

/** PATCH /api/admin/orders/[id] — fulfilment status, cancel, refund, notes (§6.7). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const by = auth.admin.email;
  const note = typeof body.note === "string" ? body.note.trim() : undefined;

  try {
    await connectDb();

    if (body.action === "status") {
      const next = body.status;
      if (!ORDER_STATUSES.includes(next as OrderStatus)) {
        return NextResponse.json({ error: "Choose a valid status." }, { status: 400 });
      }
      const order = await updateOrderStatus(id, next as OrderStatus, {
        note,
        by,
      });
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${id}`);
      return NextResponse.json({ order: { status: order.status } });
    }

    if (body.action === "cancel") {
      const order = await cancelOrder(id, { note, by });
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${id}`);
      return NextResponse.json({ order: { status: order.status } });
    }

    if (body.action === "refund") {
      const order = await refundOrder(id, { note, by });
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${id}`);
      revalidatePath("/admin/payments");
      return NextResponse.json({
        order: { status: order.status, paymentStatus: order.paymentStatus },
      });
    }

    if (body.action === "notes") {
      const notes = typeof body.notes === "string" ? body.notes : "";
      const order = await setAdminNotes(id, notes);
      revalidatePath(`/admin/orders/${id}`);
      return NextResponse.json({ order: { adminNotes: order.adminNotes } });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    if (error instanceof OrderAdminError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Could not update the order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
