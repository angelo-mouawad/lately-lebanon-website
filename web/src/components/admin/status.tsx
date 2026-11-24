import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@latelylebanon/shared";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const ORDER_TONES: Record<OrderStatus, BadgeTone> = {
  NEW: "accent",
  CONFIRMED: "neutral",
  HANDED_TO_DELIVERY: "warning",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "danger",
};

const PAYMENT_TONES: Record<PaymentStatus, BadgeTone> = {
  UNPAID: "neutral",
  PENDING: "warning",
  PAID: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge tone={ORDER_TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
);

export const PaymentBadge = ({ status, method }: { status: PaymentStatus; method?: PaymentMethod }) => (
  <Badge tone={PAYMENT_TONES[status]}>
    {method && status !== "PAID" ? `${PAYMENT_METHOD_LABELS[method]}: ` : ""}
    {PAYMENT_STATUS_LABELS[status]}
  </Badge>
);

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const dateOnly = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));
