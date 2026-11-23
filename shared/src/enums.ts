export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "HANDED_TO_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  HANDED_TO_DELIVERY: "Handed to delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

/** Which status an order can move to from each status. */
export const ORDER_STATUS_FLOW: Record<OrderStatus, readonly OrderStatus[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["HANDED_TO_DELIVERY", "CANCELLED"],
  HANDED_TO_DELIVERY: ["DELIVERED", "RETURNED", "CANCELLED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export function canMoveOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_FLOW[from].includes(to);
}

export const PAYMENT_METHODS = ["COD", "CARD", "WHISH"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: "Cash on delivery",
  CARD: "Visa or Mastercard",
  WHISH: "Whish",
};

export const PAYMENT_STATUSES = ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Not paid",
  PENDING: "Waiting for payment",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export const PROMO_TYPES = ["PERCENT", "FIXED"] as const;
export type PromoType = (typeof PROMO_TYPES)[number];

export const ADMIN_ROLES = ["OWNER", "EDITOR"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PRODUCT_SORTS = ["newest", "price-asc", "price-desc", "name"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const UPLOAD_KINDS = ["product", "brand-logo", "brand-cover", "category", "hero"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

/** Minutes before an unpaid card or Whish order is cancelled and its stock released. */
export const UNPAID_ORDER_TTL_MINUTES = 30;
