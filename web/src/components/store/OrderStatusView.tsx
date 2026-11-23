import { formatUSD, PAYMENT_METHOD_LABELS, type OrderStatus, type TrackedOrder } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { cn } from "@/lib/cn";

const t = getMessages();

const STEPS: OrderStatus[] = ["NEW", "CONFIRMED", "HANDED_TO_DELIVERY", "DELIVERED"];

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Where an order is, as a simple step line, plus what's in it. */
export function OrderStatusView({ order }: { order: TrackedOrder }) {
  const stopped = order.status === "CANCELLED" || order.status === "RETURNED";
  const reached = STEPS.indexOf(order.status);
  const when = (status: OrderStatus) => order.history.find((h) => h.status === status)?.at;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <p className="label text-muted">{fmt(t.track.placed, { date: dateFormat.format(new Date(order.createdAt)) })}</p>
        <p className="font-serif text-3xl">{t.track.status[order.status]}</p>
        <p className="text-[15px] text-ink-soft">{t.track.statusHelp[order.status]}</p>
      </div>

      {!stopped && (
        <ol className="grid grid-cols-4 border-t border-line">
          {STEPS.map((step, i) => {
            const done = i <= reached;
            const at = when(step);
            return (
              <li key={step} className={cn("flex flex-col gap-1 border-t-2 pt-3 pr-2", done ? "border-olive" : "-mt-px border-transparent")}>
                <span className={cn("text-xs sm:text-sm", done ? "font-medium" : "text-muted")}>{t.track.status[step]}</span>
                {at && <span className="text-xs text-muted tabular-nums">{timeFormat.format(new Date(at))}</span>}
              </li>
            );
          })}
        </ol>
      )}

      <div>
        <h2 className="label mb-3">{t.track.items}</h2>
        <ul className="divide-y divide-line border-y border-line">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4 py-3 text-[15px]">
              <span>
                {item.quantity} x {item.productName}
                {item.variantLabel && <span className="text-muted">, {item.variantLabel}</span>}
              </span>
              <span className="tabular-nums">{formatUSD(item.unitPriceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 flex flex-col gap-2 text-[15px]">
          {order.discountCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t.cart.discount}</dt>
              <dd className="tabular-nums">-{formatUSD(order.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-soft">{t.cart.delivery}</dt>
            <dd className="tabular-nums">{order.deliveryFeeCents === 0 ? t.common.free : formatUSD(order.deliveryFeeCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink pt-3 text-lg">
            <dt>{t.track.total}</dt>
            <dd className="tabular-nums">{formatUSD(order.totalCents)}</dd>
          </div>
          <p className="text-sm text-muted">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
        </dl>
      </div>
    </div>
  );
}
