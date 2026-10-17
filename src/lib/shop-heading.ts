import type { ShopParams } from "@/components/storefront/shop-explorer";

/**
 * Heading for the shop page, derivable on the server from the URL filters.
 * Kept out of the client `shop-explorer` module so the server page can call it.
 */
export function shopHeadingFor(params: ShopParams): string {
  if (params.category) {
    return params.category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  if (params.availability === "pre_order") return "Pre-order collection";
  return "All rings";
}
