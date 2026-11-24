"use client";

import Link from "next/link";
import { formatLebanesePhone, formatUSD, type AdminOrderRow } from "@latelylebanon/shared";
import { formatDateTime, OrderStatusBadge, PaymentBadge } from "./status";

/** Orders as tappable rows: works the same on a phone and a laptop. */
export function OrderList({ orders }: { orders: AdminOrderRow[] }) {
  return (
    <ul className="divide-y divide-line border border-line bg-paper">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/admin/orders/${o.id}`} className="grid gap-2 p-4 hover:bg-sand sm:grid-cols-[110px_1fr_auto_auto] sm:items-center sm:gap-5">
            <div className="flex items-baseline justify-between gap-3 sm:block">
              <p className="font-medium tabular-nums">{o.number}</p>
              <p className="text-xs text-muted tabular-nums">{formatDateTime(o.createdAt)}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate">{o.customerName}</p>
              <p className="truncate text-sm text-muted">
                {formatLebanesePhone(o.phone)} · {o.region} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            <p className="tabular-nums sm:text-right">{formatUSD(o.totalCents)}</p>
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              <OrderStatusBadge status={o.status} />
              <PaymentBadge status={o.paymentStatus} method={o.paymentMethod} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
