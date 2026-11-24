"use client";

import Link from "next/link";
import { formatUSD, type DashboardData } from "@latelylebanon/shared";
import { useAuth } from "@/components/admin/AuthProvider";
import { OrderList } from "@/components/admin/OrderList";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";

function Stat({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) {
  const body = (
    <>
      <p className="label text-muted">{label}</p>
      <p className="mt-2 font-serif text-4xl tabular-nums">{value}</p>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block bg-paper p-5 hover:bg-sand">
      {body}
    </Link>
  ) : (
    <div className="bg-paper p-5">{body}</div>
  );
}

export default function DashboardPage() {
  const { me } = useAuth();
  const { data, error, loading, reload } = useAdminQuery<DashboardData>("/dashboard");
  const firstName = me.name.split(" ")[0];

  return (
    <>
      <PageHeader title={`Hello, ${firstName}`} description="What's happening in the shop today." />
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {loading && !data && <LoadingBlock rows={5} />}
      {data && (
        <div className="flex flex-col gap-10">
          <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Waiting for you"
              value={String(data.newOrdersWaiting)}
              note={data.newOrdersWaiting === 1 ? "new order to confirm" : "new orders to confirm"}
              href="/admin/orders?status=NEW"
            />
            <Stat label="Orders today" value={String(data.ordersToday)} />
            <Stat label="Orders this month" value={String(data.ordersThisMonth)} />
            {data.money && <Stat label="Sales today" value={formatUSD(data.money.revenueTodayCents)} />}
          </div>

          {data.money && (
            <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
              <Stat label="Sales this month" value={formatUSD(data.money.revenueThisMonthCents)} note="All orders except cancelled and returned" />
              <Stat
                label="Our commission this month"
                value={formatUSD(data.money.commissionThisMonthCents)}
                note="On this month's orders, before delivery"
              />
              <Stat
                label="Commission earned"
                value={formatUSD(data.money.commissionAllTimeCents)}
                note="All delivered orders, all time"
                href="/admin/balances"
              />
            </div>
          )}

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-serif text-2xl">Newest orders</h2>
              <Link href="/admin/orders" className="text-sm underline underline-offset-4">
                All orders
              </Link>
            </div>
            {data.latestOrders.length === 0 ? <EmptyBlock title="No orders yet." /> : <OrderList orders={data.latestOrders} />}
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl">Running low</h2>
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-muted">Nothing is running low. Everything on the website has more than 3 in stock.</p>
            ) : (
              <ul className="divide-y divide-line border border-line bg-paper">
                {data.lowStock.map((v, i) => (
                  <li key={`${v.productId}-${i}`}>
                    <Link href={`/admin/products/${v.productId}`} className="flex items-center justify-between gap-4 p-4 hover:bg-sand">
                      <span>
                        {v.productName}
                        {v.variantLabel && <span className="text-muted">, {v.variantLabel}</span>}
                      </span>
                      <span className={`text-sm tabular-nums ${v.stock === 0 ? "text-danger" : "text-terracotta"}`}>
                        {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
