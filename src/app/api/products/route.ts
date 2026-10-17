import { NextRequest, NextResponse } from "next/server";
import { queryProducts, type ProductFilterParams } from "@/lib/products";

/** GET /api/products — filtered, sorted, paginated catalog (§5.2, §13.1). */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: ProductFilterParams = {
    category: sp.get("category") ?? undefined,
    type: sp.get("type") ?? undefined,
    material: sp.get("material") ?? undefined,
    color: sp.get("color") ?? undefined,
    shape: sp.get("shape") ?? undefined,
    size: sp.get("size") ?? undefined,
    availability: sp.get("availability") ?? undefined,
    min: sp.get("min") ?? undefined,
    max: sp.get("max") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    q: sp.get("q") ?? undefined,
  };
  const limit = Math.min(Number(sp.get("limit") ?? 24) || 24, 48);
  const skip = Math.max(Number(sp.get("skip") ?? 0) || 0, 0);

  try {
    const { products, total } = await queryProducts(params, { limit, skip });
    return NextResponse.json({ products, total });
  } catch {
    return NextResponse.json(
      { error: "The catalog could not be loaded. Try again shortly." },
      { status: 503 },
    );
  }
}
