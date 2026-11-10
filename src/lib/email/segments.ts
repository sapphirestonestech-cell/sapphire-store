export type EmailSegmentType =
  | "customers"
  | "users"
  | "all_contacts"
  | "product"
  | "category"
  | "ring_type"
  | "preorder"
  | "repeat"
  | "abandoned";

export type RingType = "engagement" | "female" | "male";

export interface EmailSegment {
  type: EmailSegmentType;
  productId?: string;
  categoryId?: string;
  ringType?: RingType;
  days?: number;
}

export const SEGMENT_LABELS: Record<EmailSegmentType, string> = {
  customers: "Customers — anyone who has bought",
  users: "Users — accounts with no purchase",
  all_contacts: "Everyone — customers and users",
  product: "Customers who bought a specific ring",
  category: "Customers who bought from a category",
  ring_type: "Customers who bought a type of ring",
  preorder: "Pre-order customers",
  repeat: "Repeat customers — 2 or more paid orders",
  abandoned: "Abandoned checkout",
};

export const RING_TYPE_LABELS: Record<RingType, string> = {
  engagement: "Engagement rings",
  female: "Women's rings",
  male: "Men's rings",
};

export const DEFAULT_ABANDONED_DAYS = 30;

const SEGMENT_TYPES = Object.keys(SEGMENT_LABELS) as EmailSegmentType[];
const RING_TYPES = new Set<RingType>(["engagement", "female", "male"]);

export function isEmailSegmentType(value: unknown): value is EmailSegmentType {
  return typeof value === "string" && SEGMENT_TYPES.includes(value as EmailSegmentType);
}

export function isRingType(value: unknown): value is RingType {
  return typeof value === "string" && RING_TYPES.has(value as RingType);
}

export function segmentDescription(
  segment: EmailSegment,
  names: { productName?: string; categoryName?: string } = {},
): string {
  switch (segment.type) {
    case "customers":
      return "Customers — anyone who has bought";
    case "users":
      return "Users — accounts with no purchase";
    case "all_contacts":
      return "Everyone — customers and users";
    case "product":
      return `Customers who bought ${names.productName ?? "a product"}`;
    case "category":
      return `Customers who bought from ${names.categoryName ?? "a category"}`;
    case "ring_type":
      return `Customers who bought ${RING_TYPE_LABELS[segment.ringType ?? "engagement"]}`;
    case "preorder":
      return "Pre-order customers";
    case "repeat":
      return "Repeat customers — 2 or more paid orders";
    case "abandoned":
      return `Abandoned checkout — last ${segment.days ?? DEFAULT_ABANDONED_DAYS} days`;
  }
}
