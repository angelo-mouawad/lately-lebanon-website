"use client";

import { useState, type FormEvent } from "react";
import { formatUSD, payoutSchema, type BrandBalance, type BrandPayoutRow } from "@latelylebanon/shared";
import { adminFetch, adminUrl } from "@/lib/admin-api";
import { cn } from "@/lib/cn";
import { zodFields } from "@/lib/zod-fields";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Select } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { OwnerOnly } from "@/components/admin/OwnerOnly";
import { formatDate } from "@/components/admin/status";
import { useToast } from "@/components/admin/Toast";
import { EmptyBlock, ErrorBlock, FormError, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";
import { useSave } from "@/components/admin/use-save";

const today = () => new Date().toISOString().slice(0, 10);

function PayoutModal({
  balances,
  brandId,
  onClose,
  onSaved,
}: {
  balances: BrandBalance[];
  brandId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = balances.find((b) => b.brandId === brandId);
  const [form, setForm] = useState({
    brandId: brandId ?? balances[0]?.brandId ?? 0,
    amountCents: initial && initial.balanceCents > 0 ? initial.balanceCents : (null as number | null),
    paidAt: today(),
    method: "Cash",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useSave();
  const selected = balances.find((b) => b.brandId === form.brandId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = payoutSchema.safeParse(form);
    if (!parsed.success) return setErrors(zodFields(parsed.error));
    setErrors({});
    const ok = await save.run(() => adminFetch("/payouts", { method: "POST", body: parsed.data }));
    if (ok) onSaved();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Record a payout"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="payout-form" loading={save.busy}>
            Save payout
          </Button>
        </>
      }
    >
      <form id="payout-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <p className="text-sm text-muted">Write down money you've paid a brand, so the balance stays right.</p>
        <FormError message={save.error} />
        <Field label="Brand" error={errors.brandId}>
          <Select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: Number(e.target.value) })}>
            {balances.map((b) => (
              <option key={b.brandId} value={b.brandId}>
                {b.brandName}
              </option>
            ))}
          </Select>
        </Field>
        {selected && (
          <p className="text-sm">
            Balance right now: <span className="font-medium tabular-nums">{formatUSD(selected.balanceCents)}</span>
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Amount paid" error={errors.amountCents}>
            <MoneyInput value={form.amountCents} onChange={(amountCents) => setForm({ ...form, amountCents })} />
          </Field>
          <Field label="Date" error={errors.paidAt}>
            <Input type="date" max={today()} value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
          </Field>
        </div>
        <Field label="How was it paid?" hint="For example Cash, Whish or Bank transfer" error={errors.method}>
          <Input list="payout-methods" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} />
          <datalist id="payout-methods">
            <option value="Cash" />
            <option value="Whish" />
            <option value="Bank transfer" />
            <option value="OMT" />
          </datalist>
        </Field>
        <Field label="Note" optional error={errors.note}>
          <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}

function Balances() {
  const balances = useAdminQuery<BrandBalance[]>("/balances");
  const payouts = useAdminQuery<BrandPayoutRow[]>("/payouts");
  const { notify } = useToast();
  const remove = useSave();
  const [payoutFor, setPayoutFor] = useState<number | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<BrandPayoutRow | null>(null);

  const totals = balances.data?.reduce(
    (t, b) => ({
      sales: t.sales + b.totalSalesCents,
      commission: t.commission + b.commissionCents,
      delivery: t.delivery + b.deliveryFeesCents,
      owed: t.owed + b.owedToBrandCents,
      paid: t.paid + b.paidOutCents,
      balance: t.balance + b.balanceCents,
    }),
    { sales: 0, commission: 0, delivery: 0, owed: 0, paid: 0, balance: 0 },
  );

  function reload() {
    balances.reload();
    payouts.reload();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const ok = await remove.run(async () => {
      await adminFetch(`/payouts/${deleting.id}`, { method: "DELETE" });
      return true;
    });
    setDeleting(null);
    if (ok) {
      notify("Payout deleted");
      reload();
    }
  }

  return (
    <>
      <PageHeader
        title="Brand balances"
        description="What each brand has sold, what we keep, and what we still owe them. Only delivered orders count. Brands with their own delivery service also get the delivery fees they charged."
        actions={
          <>
            <a href={adminUrl("/balances.csv")} className={buttonClass("secondary", "md")} download>
              Download CSV
            </a>
            <Button onClick={() => setPayoutFor(null)} disabled={!balances.data?.length}>
              Record a payout
            </Button>
          </>
        }
      />
      <FormError message={remove.error} />
      {balances.error && <ErrorBlock message={balances.error} onRetry={reload} />}
      {balances.loading && !balances.data && <LoadingBlock />}
      {balances.data && balances.data.length === 0 && <EmptyBlock title="No brands yet." />}

      {balances.data && balances.data.length > 0 && totals && (
        <Table>
          <THead>
            <tr>
              <TH>Brand</TH>
              <TH className="text-right">Sales</TH>
              <TH className="text-right">Our commission</TH>
              <TH className="text-right">Their delivery fees</TH>
              <TH className="text-right">Owed to brand</TH>
              <TH className="text-right">Paid out</TH>
              <TH className="text-right">Still to pay</TH>
              <TH>
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {balances.data.map((b) => (
              <TR key={b.brandId}>
                <TD className="font-medium whitespace-nowrap">{b.brandName}</TD>
                <TD className="text-right tabular-nums">{formatUSD(b.totalSalesCents)}</TD>
                <TD className="text-right tabular-nums">{formatUSD(b.commissionCents)}</TD>
                <TD className="text-right tabular-nums">{formatUSD(b.deliveryFeesCents)}</TD>
                <TD className="text-right tabular-nums">{formatUSD(b.owedToBrandCents)}</TD>
                <TD className="text-right tabular-nums">{formatUSD(b.paidOutCents)}</TD>
                <TD className={cn("text-right font-medium tabular-nums", b.balanceCents > 0 && "text-terracotta", b.balanceCents < 0 && "text-danger")}>
                  {formatUSD(b.balanceCents)}
                </TD>
                <TD className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setPayoutFor(b.brandId)}>
                    Pay
                  </Button>
                </TD>
              </TR>
            ))}
            <TR className="bg-sand font-medium">
              <TD>All brands</TD>
              <TD className="text-right tabular-nums">{formatUSD(totals.sales)}</TD>
              <TD className="text-right tabular-nums">{formatUSD(totals.commission)}</TD>
              <TD className="text-right tabular-nums">{formatUSD(totals.delivery)}</TD>
              <TD className="text-right tabular-nums">{formatUSD(totals.owed)}</TD>
              <TD className="text-right tabular-nums">{formatUSD(totals.paid)}</TD>
              <TD className="text-right tabular-nums">{formatUSD(totals.balance)}</TD>
              <TD />
            </TR>
          </TBody>
        </Table>
      )}

      <section className="mt-12">
        <h2 className="mb-3 font-serif text-2xl">Payouts recorded</h2>
        {payouts.data && payouts.data.length === 0 && <p className="text-sm text-muted">No payouts recorded yet.</p>}
        {payouts.data && payouts.data.length > 0 && (
          <Table>
            <THead>
              <tr>
                <TH>Date</TH>
                <TH>Brand</TH>
                <TH className="text-right">Amount</TH>
                <TH>Method</TH>
                <TH>Note</TH>
                <TH>
                  <span className="sr-only">Actions</span>
                </TH>
              </tr>
            </THead>
            <TBody>
              {payouts.data.map((p) => (
                <TR key={p.id}>
                  <TD className="whitespace-nowrap tabular-nums">{formatDate(p.paidAt)}</TD>
                  <TD>{p.brandName}</TD>
                  <TD className="text-right tabular-nums">{formatUSD(p.amountCents)}</TD>
                  <TD>{p.method}</TD>
                  <TD className="text-muted">
                    {p.note}
                    {p.recordedBy && <span className="block text-xs">Recorded by {p.recordedBy}</span>}
                  </TD>
                  <TD className="text-right">
                    <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleting(p)}>
                      Delete
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      {payoutFor !== undefined && balances.data && (
        <PayoutModal
          balances={balances.data}
          brandId={payoutFor}
          onClose={() => setPayoutFor(undefined)}
          onSaved={() => {
            setPayoutFor(undefined);
            notify("Payout recorded");
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this payout?"
        message={deleting ? `${formatUSD(deleting.amountCents)} to ${deleting.brandName} on ${formatDate(deleting.paidAt)}. Only delete it if it was recorded by mistake.` : ""}
        confirmLabel="Delete"
        busy={remove.busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

export default function BalancesPage() {
  return (
    <OwnerOnly>
      <Balances />
    </OwnerOnly>
  );
}
