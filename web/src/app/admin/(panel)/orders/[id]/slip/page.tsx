"use client";

import Link from "next/link";
import { use } from "react";
import { formatLebanesePhone, formatUSD, PAYMENT_METHOD_LABELS, type AdminOrder } from "@latelylebanon/shared";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/components/admin/status";
import { ErrorBlock, LoadingBlock } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";

/** A one page packing slip to print and put in the parcel or hand to the driver. */
export default function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, error, loading, reload } = useAdminQuery<AdminOrder>(`/orders/${id}`);

  if (!order) return loading ? <LoadingBlock /> : <ErrorBlock message={error ?? "Not found"} onRetry={reload} />;

  const byBrand = new Map<string, AdminOrder["items"]>();
  for (const item of order.items) byBrand.set(item.brand.name, [...(byBrand.get(item.brand.name) ?? []), item]);
  const toCollect = order.paymentMethod === "COD" && order.paymentStatus !== "PAID";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/admin/orders/${order.id}`} className="text-sm text-muted hover:text-ink">
          Back to order
        </Link>
        <Button onClick={() => window.print()}>Print</Button>
      </div>

      <article className="border border-ink bg-white p-8 print:border-0 print:p-0">
        <header className="flex items-start justify-between border-b border-ink pb-5">
          <div>
            <p className="font-serif text-2xl">Lately Lebanon</p>
            <p className="text-sm">latelylebanon.com</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl tabular-nums">{order.number}</p>
            <p className="text-sm">{formatDate(order.createdAt)}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 border-b border-ink py-5 text-[15px]">
          <div>
            <p className="label mb-1">Deliver to</p>
            <p className="font-medium">{order.customerName}</p>
            <p className="tabular-nums">{formatLebanesePhone(order.phone)}</p>
            <p className="whitespace-pre-line">{order.address}</p>
            <p>
              {order.city}, {order.region}
            </p>
          </div>
          <div className="text-right">
            <p className="label mb-1">Payment</p>
            <p>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            {toCollect ? (
              <p className="mt-2 border-2 border-ink p-2 text-center">
                <span className="label block">Collect in cash</span>
                <span className="font-serif text-3xl tabular-nums">{formatUSD(order.totalCents)}</span>
              </p>
            ) : (
              <p className="mt-2 font-medium">Already paid</p>
            )}
          </div>
        </section>

        {order.notes && (
          <section className="border-b border-ink py-4 text-[15px]">
            <p className="label mb-1">Customer note</p>
            <p>{order.notes}</p>
          </section>
        )}

        <section className="py-5">
          {[...byBrand].map(([brand, items]) => (
            <div key={brand} className="mb-5 last:mb-0">
              <p className="label mb-2">From {brand}</p>
              <table className="w-full text-[15px]">
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-line">
                      <td className="w-8 py-2 align-top">
                        <span className="inline-block size-4 border border-ink" aria-hidden />
                      </td>
                      <td className="py-2">
                        {item.productName}
                        {item.variantLabel && <span className="text-ink-soft">, {item.variantLabel}</span>}
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums">x {item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        <footer className="border-t border-ink pt-4 text-sm">
          Thank you for buying from Lebanese makers. Questions? WhatsApp us or email info@latelylebanon.com.
        </footer>
      </article>
    </div>
  );
}
