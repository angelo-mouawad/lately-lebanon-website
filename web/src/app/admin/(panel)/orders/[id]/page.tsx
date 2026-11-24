"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useState } from "react";
import {
  formatLebanesePhone,
  formatUSD,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type AdminOrder,
  type OrderStatus,
} from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { whatsappLink } from "@/lib/whatsapp";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/admin/AuthProvider";
import { formatDateTime, OrderStatusBadge, PaymentBadge } from "@/components/admin/status";
import { useToast } from "@/components/admin/Toast";
import { ErrorBlock, FormError, LoadingBlock, PageHeader, Section } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";
import { useSave } from "@/components/admin/use-save";

const ACTIONS: Record<OrderStatus, string> = {
  NEW: "Mark as new",
  CONFIRMED: "Confirm order",
  HANDED_TO_DELIVERY: "Handed to delivery",
  DELIVERED: "Mark as delivered",
  CANCELLED: "Cancel order",
  RETURNED: "Mark as returned",
};

const NEEDS_CONFIRM: OrderStatus[] = ["CANCELLED", "RETURNED"];

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, setData, error, loading, reload } = useAdminQuery<AdminOrder>(`/orders/${id}`);
  const { isOwner } = useAuth();
  const { notify } = useToast();
  const save = useSave();
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState("");
  const [confirmPaid, setConfirmPaid] = useState(false);

  async function move(status: OrderStatus, withNote?: string) {
    const updated = await save.run(() =>
      adminFetch<AdminOrder>(`/orders/${id}/status`, { method: "POST", body: { status, note: withNote || null } }),
    );
    setPending(null);
    setNote("");
    if (updated) {
      setData(updated);
      notify(`Order is now: ${ORDER_STATUS_LABELS[status]}`);
    }
  }

  async function markPaid() {
    const updated = await save.run(() => adminFetch<AdminOrder>(`/orders/${id}/mark-paid`, { method: "POST" }));
    setConfirmPaid(false);
    if (updated) {
      setData(updated);
      notify("Marked as paid");
    }
  }

  const back = (
    <Link href="/admin/orders" className="text-sm text-muted hover:text-ink">
      Orders
    </Link>
  );

  if (!order) {
    return (
      <>
        <PageHeader title="Order" back={back} />
        {loading && <LoadingBlock rows={6} />}
        {error && <ErrorBlock message={error} onRetry={reload} />}
      </>
    );
  }

  const firstName = order.customerName.split(" ")[0] ?? order.customerName;
  const canMarkPaid = order.paymentMethod === "COD" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";

  return (
    <>
      <PageHeader
        title={order.number}
        back={back}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <ButtonLink href={`/admin/orders/${order.id}/slip`} variant="secondary" size="sm">
            Packing slip
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex flex-col gap-6">
          <FormError message={save.error} />

          <Section>
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
            </div>
            {order.nextStatuses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {order.nextStatuses.map((s) =>
                  NEEDS_CONFIRM.includes(s) ? (
                    <Button key={s} variant="danger" onClick={() => setPending(s)} disabled={save.busy}>
                      {ACTIONS[s]}
                    </Button>
                  ) : (
                    <Button key={s} onClick={() => void move(s)} loading={save.busy}>
                      {ACTIONS[s]}
                    </Button>
                  ),
                )}
                {canMarkPaid && (
                  <Button variant="secondary" onClick={() => setConfirmPaid(true)} disabled={save.busy}>
                    Mark as paid
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">This order is finished. Nothing else to do.</p>
            )}
          </Section>

          <Section title="Items">
            <ul className="divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <div className="relative aspect-4/5 w-14 shrink-0 bg-sand-deep">
                    {item.image && <Image src={item.image.sm} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${item.productId}`} className="font-medium hover:underline">
                      {item.productName}
                    </Link>
                    {item.variantLabel && <p className="text-sm text-muted">{item.variantLabel}</p>}
                    <p className="text-sm text-muted">
                      by{" "}
                      <Link href={`/admin/brands/${item.brand.id}`} className="underline underline-offset-2">
                        {item.brand.name}
                      </Link>
                      {item.brand.phone && (
                        <>
                          {" "}
                          ·{" "}
                          <a href={`tel:${item.brand.phone}`} className="underline underline-offset-2">
                            {item.brand.phone}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <p>
                      {item.quantity} x {formatUSD(item.unitPriceCents)}
                    </p>
                    <p className="font-medium">{formatUSD(item.lineTotalCents)}</p>
                    {isOwner && <p className="text-xs text-muted">{item.commissionPct}% commission</p>}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="ml-auto flex w-full max-w-xs flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatUSD(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
                  <dd className="tabular-nums">-{formatUSD(order.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Delivery ({order.region})</dt>
                <dd className="tabular-nums">{order.deliveryFeeCents === 0 ? "Free" : formatUSD(order.deliveryFeeCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink pt-2 text-base font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatUSD(order.totalCents)}</dd>
              </div>
            </dl>
          </Section>

          <Section title="History">
            <ol className="flex flex-col gap-3">
              {order.history.map((h, i) => (
                <li key={i} className="grid grid-cols-[110px_1fr] gap-3 text-sm">
                  <span className="text-muted tabular-nums">{formatDateTime(h.at)}</span>
                  <span>
                    <span className="font-medium">{ORDER_STATUS_LABELS[h.status]}</span>
                    {h.by && <span className="text-muted"> by {h.by}</span>}
                    {h.note && <span className="block text-ink-soft">{h.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <aside className="flex flex-col gap-6">
          <Section title="Customer">
            <div className="flex flex-col gap-1 text-[15px]">
              <p className="font-medium">{order.customerName}</p>
              <a href={`tel:${order.phone}`} className="tabular-nums underline underline-offset-2">
                {formatLebanesePhone(order.phone)}
              </a>
              {order.email && (
                <a href={`mailto:${order.email}`} className="underline underline-offset-2">
                  {order.email}
                </a>
              )}
            </div>
            <a
              href={whatsappLink(order.phone, `Hi ${firstName}, this is Lately Lebanon about your order ${order.number}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 border border-olive bg-olive px-4 text-sm text-paper hover:border-ink hover:bg-ink"
            >
              <WhatsAppIcon className="size-5" /> Message on WhatsApp
            </a>
          </Section>
          <Section title="Delivery">
            <p className="text-[15px] leading-relaxed whitespace-pre-line">
              {order.address}
              {"\n"}
              {order.city}, {order.region}
            </p>
            {order.notes && <p className="border-l-2 border-terracotta pl-3 text-sm">{order.notes}</p>}
          </Section>
          <Section title="Payment">
            <p className="text-[15px]">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            {order.paidAt && <p className="text-sm text-muted">Paid {formatDateTime(order.paidAt)}</p>}
            {order.payments
              .filter((p) => p.reference)
              .map((p, i) => (
                <p key={i} className="text-xs break-all text-muted">
                  Reference: {p.reference}
                </p>
              ))}
          </Section>
        </aside>
      </div>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending === "CANCELLED" ? "Cancel this order?" : "Mark this order as returned?"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Go back
            </Button>
            <Button variant="danger" loading={save.busy} onClick={() => pending && void move(pending, note)}>
              {pending ? ACTIONS[pending] : ""}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-ink-soft">
            {pending === "CANCELLED"
              ? "The items go back into stock and the order won't count in brand balances. This can't be undone."
              : "The order won't count in brand balances. Stock isn't changed: update it by hand if the items can be sold again."}
          </p>
          <Field label="Reason" optional>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmPaid}
        title="Mark as paid?"
        message={`Only do this once the ${formatUSD(order.totalCents)} in cash has been received.`}
        confirmLabel="Yes, it's paid"
        tone="primary"
        busy={save.busy}
        onConfirm={() => void markPaid()}
        onCancel={() => setConfirmPaid(false)}
      />
    </>
  );
}
