"use client";

import { useState, type FormEvent } from "react";
import { formatUSD, promoCodeSchema, type AdminPromoCode, type PromoType } from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { zodFields } from "@/lib/zod-fields";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Select, Switch } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { OwnerOnly } from "@/components/admin/OwnerOnly";
import { formatDate } from "@/components/admin/status";
import { useToast } from "@/components/admin/Toast";
import { EmptyBlock, ErrorBlock, FormError, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";
import { useSave } from "@/components/admin/use-save";

interface Draft {
  id?: number;
  code: string;
  type: PromoType;
  value: number | null;
  minOrderCents: number | null;
  expiresAt: string;
  usageLimit: string;
  isActive: boolean;
}

const empty: Draft = { code: "", type: "PERCENT", value: 10, minOrderCents: null, expiresAt: "", usageLimit: "", isActive: true };

function describe(p: AdminPromoCode) {
  const off = p.type === "PERCENT" ? `${p.value}% off` : `${formatUSD(p.value)} off`;
  return p.minOrderCents > 0 ? `${off} orders over ${formatUSD(p.minOrderCents)}` : off;
}

function PromoModal({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useSave();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = {
      code: d.code,
      type: d.type,
      value: d.value,
      minOrderCents: d.minOrderCents ?? 0,
      expiresAt: d.expiresAt || null,
      usageLimit: d.usageLimit ? Number(d.usageLimit) : null,
      isActive: d.isActive,
    };
    const parsed = promoCodeSchema.safeParse(body);
    if (!parsed.success) return setErrors(zodFields(parsed.error));
    setErrors({});
    const ok = await save.run(() =>
      d.id ? adminFetch(`/promo-codes/${d.id}`, { method: "PUT", body }) : adminFetch("/promo-codes", { method: "POST", body }),
    );
    if (ok) onSaved();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={d.id ? `Edit ${d.code}` : "New promo code"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="promo-form" loading={save.busy}>
            Save
          </Button>
        </>
      }
    >
      <form id="promo-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <FormError message={save.error} />
        <Field label="Code" hint="What customers type at checkout, for example SUMMER15" error={errors.code ?? save.fields.code}>
          <Input value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase().replace(/\s/g, "") })} data-autofocus />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Discount type">
            <Select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as PromoType, value: null })}>
              <option value="PERCENT">Percentage off</option>
              <option value="FIXED">Amount off</option>
            </Select>
          </Field>
          <Field label={d.type === "PERCENT" ? "Percent off" : "Amount off"} error={errors.value}>
            {d.type === "PERCENT" ? (
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={d.value ?? ""}
                onChange={(e) => setD({ ...d, value: e.target.value ? Number(e.target.value) : null })}
              />
            ) : (
              <MoneyInput value={d.value} onChange={(value) => setD({ ...d, value })} />
            )}
          </Field>
        </div>
        <Field label="Minimum order" optional hint="The bag must be at least this much before the code works." error={errors.minOrderCents}>
          <MoneyInput value={d.minOrderCents} onChange={(minOrderCents) => setD({ ...d, minOrderCents })} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Last day it works" optional error={errors.expiresAt}>
            <Input type="date" value={d.expiresAt} onChange={(e) => setD({ ...d, expiresAt: e.target.value })} />
          </Field>
          <Field label="How many times it can be used" optional hint="Leave empty for no limit" error={errors.usageLimit}>
            <Input type="number" inputMode="numeric" min={1} value={d.usageLimit} onChange={(e) => setD({ ...d, usageLimit: e.target.value })} />
          </Field>
        </div>
        <Switch label="Active" description="Turn off to stop the code working straight away." checked={d.isActive} onChange={(isActive) => setD({ ...d, isActive })} />
      </form>
    </Modal>
  );
}

function PromoCodes() {
  const { data, error, loading, reload } = useAdminQuery<AdminPromoCode[]>("/promo-codes");
  const { notify } = useToast();
  const remove = useSave();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<AdminPromoCode | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    const ok = await remove.run(async () => {
      await adminFetch(`/promo-codes/${deleting.id}`, { method: "DELETE" });
      return true;
    });
    setDeleting(null);
    if (ok) {
      notify("Code deleted");
      reload();
    }
  }

  return (
    <>
      <PageHeader title="Promo codes" description="Discount codes customers can enter in their bag or at checkout." actions={<Button onClick={() => setEditing(empty)}>New code</Button>} />
      <FormError message={remove.error} />
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {loading && !data && <LoadingBlock />}
      {data && data.length === 0 && <EmptyBlock title="No promo codes yet." />}
      {data && data.length > 0 && (
        <ul className="divide-y divide-line border border-line bg-paper">
          {data.map((p) => {
            const expired = p.expiresAt != null && p.expiresAt < new Date().toISOString().slice(0, 10);
            const usedUp = p.usageLimit != null && p.timesUsed >= p.usageLimit;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium tracking-wide">{p.code}</p>
                  <p className="text-sm text-muted">
                    {describe(p)} · used {p.timesUsed}
                    {p.usageLimit ? ` of ${p.usageLimit}` : ""} times
                    {p.expiresAt ? ` · until ${formatDate(p.expiresAt)}` : ""}
                  </p>
                </div>
                <Badge tone={!p.isActive || expired || usedUp ? "neutral" : "olive"}>
                  {!p.isActive ? "Off" : expired ? "Expired" : usedUp ? "Used up" : "Active"}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setEditing({
                        id: p.id,
                        code: p.code,
                        type: p.type,
                        value: p.value,
                        minOrderCents: p.minOrderCents || null,
                        expiresAt: p.expiresAt ?? "",
                        usageLimit: p.usageLimit ? String(p.usageLimit) : "",
                        isActive: p.isActive,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleting(p)}>
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {editing && (
        <PromoModal
          draft={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            notify("Saved");
            reload();
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.code ?? "code"}?`}
        message="Customers won't be able to use it any more. Past orders keep their discount. To pause a code instead, edit it and turn it off."
        confirmLabel="Delete"
        busy={remove.busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

export default function PromoCodesPage() {
  return (
    <OwnerOnly>
      <PromoCodes />
    </OwnerOnly>
  );
}
