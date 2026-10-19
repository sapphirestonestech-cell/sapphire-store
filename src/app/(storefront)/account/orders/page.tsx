import Link from "next/link";
import { getCurrentCustomer } from "@/lib/account-session";
import { getOrdersForCustomer } from "@/lib/orders";
import { fromMinor } from "@/lib/checkout";
import { formatPrice } from "@/lib/currency";

export const metadata = { title: "Orders · Account" };

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AccountOrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return (
      <section>
        <h2 className="text-subheading font-semibold">Orders</h2>
        <p className="mt-2 text-body text-soft-taupe">
          Sign in to see your order history.
        </p>
      </section>
    );
  }

  const orders = await getOrdersForCustomer(customer.id, customer.email);

  return (
    <section aria-labelledby="orders-heading">
      <h2 id="orders-heading" className="text-subheading font-semibold">
        Orders
      </h2>
      <p className="mt-1 mb-6 text-body text-soft-taupe">
        Every order placed with this account, newest first.
      </p>

      {orders.length === 0 ? (
        <div className="rounded-card bg-pure-white p-8 text-center shadow-card">
          <p className="text-body-lg text-warm-ink">No orders yet</p>
          <p className="mt-2 text-body text-soft-taupe">
            When you place an order, it will show up here with its status.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-12 items-center rounded-pill bg-champagne-gold px-8 text-body-lg font-medium text-warm-ink shadow-gold-glow"
          >
            Browse rings
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.orderNumber}
              className="rounded-card bg-pure-white p-6 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/order/${order.orderNumber}`}
                    className="text-body-lg font-medium text-warm-ink underline-offset-4 hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="mt-1 text-body text-soft-taupe">
                    {formatDate(order.createdAt)} · {order.items.length}{" "}
                    {order.items.length === 1 ? "ring" : "rings"} ·{" "}
                    {order.location.cityArea}, {order.location.country}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-body-lg font-semibold">
                    {formatPrice(
                      fromMinor(order.totalMinor),
                      order.baseCurrency,
                    )}
                  </p>
                  <p className="mt-1 inline-flex rounded-chip-label bg-gold-wash px-2 py-0.5 text-label font-medium text-deep-gold">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </p>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-3 border-t border-hairline pt-4">
                {order.items.map((item, i) => (
                  <li key={`${order.orderNumber}:${i}`} className="flex items-center gap-2">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="size-10 rounded-chip-label object-cover"
                      />
                    ) : (
                      <span className="grid size-10 place-items-center rounded-chip-label bg-gold-wash text-label text-deep-gold">
                        Ring
                      </span>
                    )}
                    <span className="text-body text-soft-taupe">
                      {item.name}{" "}
                      <span className="text-warm-ink">· {item.sizeLabel}</span> ×{" "}
                      {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
