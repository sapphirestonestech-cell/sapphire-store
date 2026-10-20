import { requireAdmin } from "@/lib/admin/auth";
import { connectDb } from "@/lib/db";
import {
  ordersToCsv,
  parseOrderFilters,
  queryAdminOrders,
} from "@/lib/admin/orders";

/** GET /api/admin/orders/export — the filtered orders as CSV (§6.7). */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const filters = parseOrderFilters(
    Object.fromEntries(url.searchParams.entries()),
  );

  try {
    await connectDb();
    const orders = await queryAdminOrders(filters, 5000);
    const csv = ordersToCsv(orders);
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("We couldn't build the export. Try again.", {
      status: 500,
    });
  }
}
