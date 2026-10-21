import { connectDb } from "@/lib/db";
import { OrderModel, type OrderDoc } from "@/lib/models/order";
import { ProductModel } from "@/lib/models/product";
import { CategoryModel } from "@/lib/models/category";
import { getSettings } from "@/lib/settings";
import { convertAmount, roundAmount, type Currency } from "@/lib/currency";
import { fromMinor } from "@/lib/checkout";
import { queryAdminOrders } from "@/lib/admin/orders";

/**
 * Admin dashboard data — ProductReq.md §6.2.
 * Revenue counts orders the gateway confirmed and that were not cancelled or
 * refunded. Each order keeps its own frozen exchange rate, so totals convert
 * order by order before rounding once.
 *
 * Every breakdown below is derived from the paid-order set so all the figures
 * on the dashboard describe the same slice of trade. Money is always converted
 * with each order's frozen rate, never the current one.
 */

export type ChartRange = "30d" | "12w" | "12m";

export const CHART_RANGES: { value: ChartRange; label: string }[] = [
  { value: "30d", label: "Daily" },
  { value: "12w", label: "Weekly" },
  { value: "12m", label: "Monthly" },
];

/** Products at or below this many rings in total get the low-stock card. */
export const LOW_STOCK_THRESHOLD = 2;

/** How many rows the "best sellers" and category breakdowns keep. */
export const TOP_PRODUCT_LIMIT = 6;
export const TOP_CATEGORY_LIMIT = 6;

export function parseChartRange(value?: string): ChartRange {
  return value === "12w" || value === "12m" ? value : "30d";
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface Breakdown {
  label: string;
  value: number;
}

export interface ProductPerformance {
  name: string;
  slug: string;
  units: number;
  revenue: number;
  /** Total for everything sold in the period, for the share bar. */
  share: number;
}

export interface CategoryPerformance {
  name: string;
  revenue: number;
  units: number;
}

export interface DashboardData {
  sales: { usd: number; ngn: number };
  ordersToday: number;
  pendingPayment: number;
  awaitingShipment: number;
  preordersAwaitingArrival: number;
  lowStock: number;
  /** Paid orders in the loaded window, for "average order" style figures. */
  paidOrderCount: number;
  averageOrderValue: number;
  recentOrders: OrderDoc[];
  baseCurrency: Currency;
  chart: {
    range: ChartRange;
    points: ChartPoint[];
    max: number;
    total: number;
  };
  /** Revenue split by item availability — the donut. */
  revenueByAvailability: { label: string; value: number; availability: "in_stock" | "pre_order" }[];
  /** Revenue by admin category — the second donut. */
  revenueByCategory: CategoryPerformance[];
  /** Best-selling rings, by units then revenue. */
  topProducts: ProductPerformance[];
  /** Order counts by status — horizontal bars (colour + icon + label). */
  ordersByStatus: { status: string; count: number }[];
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "short" });
}

function buildBuckets(
  range: ChartRange,
  now: Date,
): { starts: Date[]; ends: Date[]; labels: string[] } {
  const starts: Date[] = [];
  const ends: Date[] = [];
  const labels: string[] = [];

  if (range === "30d") {
    const first = startOfDay(addDays(now, -29));
    for (let i = 0; i < 30; i++) {
      const start = addDays(first, i);
      starts.push(start);
      ends.push(addDays(start, 1));
      labels.push(dayLabel(start));
    }
    return { starts, ends, labels };
  }

  if (range === "12w") {
    const thisWeek = startOfDay(addDays(now, -((now.getDay() + 6) % 7)));
    const first = addDays(thisWeek, -7 * 11);
    for (let i = 0; i < 12; i++) {
      const start = addDays(first, i * 7);
      starts.push(start);
      ends.push(addDays(start, 7));
      labels.push(dayLabel(start));
    }
    return { starts, ends, labels };
  }

  const first = addMonths(now, -11);
  for (let i = 0; i < 12; i++) {
    const start = addMonths(first, i);
    starts.push(start);
    ends.push(addMonths(start, 1));
    labels.push(monthLabel(start));
  }
  return { starts, ends, labels };
}

function collectedMinor(order: OrderDoc): number {
  return order.paymentAmountMinor ?? order.amountDueNowMinor;
}

/**
 * The currency `paymentAmountMinor` is expressed in: the currency the gateway
 * was charged in (naira after a conversion), or the base currency for rows
 * that never started a payment and fall back to `amountDueNowMinor`.
 */
function collectedSourceCurrency(order: OrderDoc): Currency {
  if (order.paymentAmountMinor != null) {
    return order.paymentCurrency ?? order.currency;
  }
  return order.baseCurrency ?? order.currency;
}

function collectedIn(order: OrderDoc, currency: Currency): number {
  return convertAmount(
    fromMinor(collectedMinor(order)),
    order.exchangeRate,
    collectedSourceCurrency(order),
    currency,
  );
}

/** Convert an item's base-currency minor amount into the display currency. */
function itemRevenueIn(
  lineTotalMinor: number,
  order: OrderDoc,
  currency: Currency,
): number {
  return convertAmount(
    fromMinor(lineTotalMinor),
    order.exchangeRate,
    order.baseCurrency ?? order.currency,
    currency,
  );
}

function sumBy(
  values: number[],
  currency: Currency,
  rounding: { usdDecimals: number; ngnNearest: number },
): number {
  return roundAmount(
    values.reduce((sum, value) => sum + value, 0),
    currency,
    rounding,
  );
}

export async function loadDashboard(range: ChartRange): Promise<DashboardData> {
  await connectDb();
  const settings = await getSettings();
  const now = new Date();
  const today = startOfDay(now);

  const paidQuery = {
    paymentStatus: "paid",
    status: { $nin: ["cancelled", "refunded"] },
  } as const;

  const [
    paidOrders,
    ordersToday,
    pendingPayment,
    awaitingShipment,
    preordersAwaitingArrival,
    stockProducts,
    recentOrders,
    statusCounts,
    categories,
    productCategoryMap,
  ] = await Promise.all([
    OrderModel.find(paidQuery)
      .select(
        "paymentAmountMinor paymentCurrency amountDueNowMinor baseCurrency currency exchangeRate paidAt createdAt items",
      )
      .lean(),
    OrderModel.countDocuments({ createdAt: { $gte: today } }),
    OrderModel.countDocuments({ status: "pending_payment" }),
    OrderModel.countDocuments({ status: { $in: ["paid", "processing"] } }),
    ProductModel.countDocuments({
      status: "published",
      availability: "pre_order",
    }),
    ProductModel.find({
      status: "published",
      availability: "in_stock",
    })
      .select("sizes")
      .lean(),
    queryAdminOrders({}, 8),
    OrderModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    CategoryModel.find().select("name").lean(),
    ProductModel.find().select("categories").lean(),
  ]);

  const orders = paidOrders as unknown as OrderDoc[];

  let usd = 0;
  let ngn = 0;
  for (const order of orders) {
    usd += collectedIn(order, "USD");
    ngn += collectedIn(order, "NGN");
  }

  const lowStock = (
    stockProducts as unknown as { sizes?: { stockQuantity: number }[] }[]
  ).filter(
    (product) =>
      (product.sizes ?? []).reduce(
        (sum, size) => sum + (size.stockQuantity ?? 0),
        0,
      ) <= LOW_STOCK_THRESHOLD,
  ).length;

  const { starts, ends, labels } = buildBuckets(range, now);
  const values = new Array<number>(starts.length).fill(0);
  const windowStart = starts[0]?.getTime() ?? today.getTime();
  const windowEnd = ends[ends.length - 1]?.getTime() ?? now.getTime();

  // Only orders inside the chart window inform the trend; the breakdowns use
  // the same window so every panel answers "in this period".
  const windowOrders = orders.filter((order) => {
    const at = new Date(order.paidAt ?? order.createdAt).getTime();
    return at >= windowStart && at < windowEnd;
  });

  for (const order of windowOrders) {
    const at = new Date(order.paidAt ?? order.createdAt).getTime();
    for (let i = 0; i < starts.length; i++) {
      if (at >= starts[i].getTime() && at < ends[i].getTime()) {
        values[i] += collectedIn(order, settings.baseCurrency);
        break;
      }
    }
  }

  const points = labels.map((label, index) => ({
    label,
    value: values[index],
  }));
  const max = Math.max(...values, 0);
  const chartTotal = sumBy(values, settings.baseCurrency, settings.rounding);

  // --- Revenue split: in stock vs pre-order -------------------------------
  const availabilityTotals: Record<"in_stock" | "pre_order", number> = {
    in_stock: 0,
    pre_order: 0,
  };
  for (const order of windowOrders) {
    for (const item of order.items ?? []) {
      const key = item.availability === "pre_order" ? "pre_order" : "in_stock";
      availabilityTotals[key] += itemRevenueIn(
        item.lineTotalMinor,
        order,
        settings.baseCurrency,
      );
    }
  }
  const revenueByAvailability = [
    {
      label: "In stock",
      value: roundAmount(
        availabilityTotals.in_stock,
        settings.baseCurrency,
        settings.rounding,
      ),
      availability: "in_stock" as const,
    },
    {
      label: "Pre-order",
      value: roundAmount(
        availabilityTotals.pre_order,
        settings.baseCurrency,
        settings.rounding,
      ),
      availability: "pre_order" as const,
    },
  ];

  // --- Best sellers and category mix --------------------------------------
  const productTotals = new Map<
    string,
    { name: string; slug: string; units: number; revenue: number }
  >();
  const unitsByProduct = new Map<string, number>();
  const categoryTotals = new Map<string, { revenue: number; units: number }>();
  const categoryByProduct = new Map<string, string>();
  for (const product of productCategoryMap as unknown as {
    _id: unknown;
    categories?: unknown[];
  }[]) {
    const first = product.categories?.[0];
    if (first) categoryByProduct.set(String(product._id), String(first));
  }
  const categoryName = new Map(
    (categories as unknown as { _id: unknown; name: string }[]).map((c) => [
      String(c._id),
      c.name,
    ]),
  );

  let totalItemRevenue = 0;
  for (const order of windowOrders) {
    for (const item of order.items ?? []) {
      const revenue = itemRevenueIn(
        item.lineTotalMinor,
        order,
        settings.baseCurrency,
      );
      totalItemRevenue += revenue;

      const key = item.slug || item.productId || item.name;
      const entry = productTotals.get(key) ?? {
        name: item.name,
        slug: item.slug,
        units: 0,
        revenue: 0,
      };
      entry.units += item.quantity;
      entry.revenue += revenue;
      productTotals.set(key, entry);

      unitsByProduct.set(
        item.productId,
        (unitsByProduct.get(item.productId) ?? 0) + item.quantity,
      );

      const catId = categoryByProduct.get(item.productId);
      const catName = (catId && categoryName.get(catId)) || "Uncategorised";
      const cat = categoryTotals.get(catName) ?? { revenue: 0, units: 0 };
      cat.revenue += revenue;
      cat.units += item.quantity;
      categoryTotals.set(catName, cat);
    }
  }

  const topProducts: ProductPerformance[] = [...productTotals.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, TOP_PRODUCT_LIMIT)
    .map((product) => ({
      name: product.name,
      slug: product.slug,
      units: product.units,
      revenue: roundAmount(
        product.revenue,
        settings.baseCurrency,
        settings.rounding,
      ),
      share:
        totalItemRevenue > 0
          ? Math.round((product.revenue / totalItemRevenue) * 100)
          : 0,
    }));

  const revenueByCategory: CategoryPerformance[] = [...categoryTotals.entries()]
    .map(([name, totals]) => ({
      name,
      units: totals.units,
      revenue: roundAmount(
        totals.revenue,
        settings.baseCurrency,
        settings.rounding,
      ),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_CATEGORY_LIMIT);

  const ordersByStatus = (
    statusCounts as unknown as { _id: string; count: number }[]
  )
    .filter((row) => row.count > 0)
    .map((row) => ({ status: row._id, count: row.count }));

  const paidOrderCount = windowOrders.length;
  const averageOrderValue =
    paidOrderCount > 0 ? chartTotal / paidOrderCount : 0;

  return {
    sales: {
      usd: roundAmount(usd, "USD", settings.rounding),
      ngn: roundAmount(ngn, "NGN", settings.rounding),
    },
    ordersToday,
    pendingPayment,
    awaitingShipment,
    preordersAwaitingArrival,
    lowStock,
    paidOrderCount,
    averageOrderValue: roundAmount(
      averageOrderValue,
      settings.baseCurrency,
      settings.rounding,
    ),
    recentOrders,
    baseCurrency: settings.baseCurrency,
    chart: { range, points, max, total: chartTotal },
    revenueByAvailability,
    revenueByCategory,
    topProducts,
    ordersByStatus,
  };
}
