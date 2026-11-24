"use client";

import { useState, type FormEvent } from "react";
import { deliveryZoneSchema, formatUSD, type AdminDeliveryZone } from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { zodFields } from "@/lib/zod-fields";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Switch } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { OwnerOnly } from "@/components/admin/OwnerOnly";
import { useToast } from "@/components/admin/Toast";
import { EmptyBlock, ErrorBlock, FormError, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";
import { useSave } from "@/components/admin/use-save";

interface Draft {
  id?: number;
  name: string;
  feeCents: number | null;
  isActive: boolean;
  sortOrder: number;
}

function ZoneModal({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useSave();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = { name: d.name, feeCents: d.feeCents, isActive: d.isActive, sortOrder: d.sortOrder };
    const parsed = deliveryZoneSchema.safeParse(body);
    if (!parsed.success) return setErrors(zodFields(parsed.error));
    setErrors({});
    const ok = await save.run(() =>
      d.id ? adminFetch(`/delivery-zones/${d.id}`, { method: "PUT", body }) : adminFetch("/delivery-zones", { method: "POST", body }),
    );
    if (ok) onSaved();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={d.id ? `Edit ${d.name}` : "New delivery area"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="zone-form" loading={save.busy}>
            Save
          </Button>
        </>
      }
    >
      <form id="zone-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <FormError message={save.error} />
        <Field label="Area name" hint="For example Beirut or Mount Lebanon" error={errors.name}>
          <Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} data-autofocus />
        </Field>
        <Field label="Delivery fee" error={errors.feeCents}>
          <MoneyInput value={d.feeCents} onChange={(feeCents) => setD({ ...d, feeCents })} />
        </Field>
        <Field label="Position in the list" hint="Lower numbers show first at checkout." error={errors.sortOrder}>
          <Input type="number" inputMode="numeric" min={0} value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: Number(e.target.value) || 0 })} />
        </Field>
        <Switch label="Show at checkout" checked={d.isActive} onChange={(isActive) => setD({ ...d, isActive })} />
      </form>
    </Modal>
  );
}

function Zones() {
  const { data, error, loading, reload } = useAdminQuery<AdminDeliveryZone[]>("/delivery-zones");
  const { notify } = useToast();
  const remove = useSave();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<AdminDeliveryZone | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    const ok = await remove.run(async () => {
      await adminFetch(`/delivery-zones/${deleting.id}`, { method: "DELETE" });
      return true;
    });
    setDeleting(null);
    if (ok) {
      notify("Area deleted");
      reload();
    }
  }

  return (
    <>
      <PageHeader
        title="Delivery areas"
        description="Customers pick one of these at checkout. The fee is added to their order, unless it qualifies for free delivery."
        actions={<Button onClick={() => setEditing({ name: "", feeCents: null, isActive: true, sortOrder: data?.length ?? 0 })}>New area</Button>}
      />
      <FormError message={remove.error} />
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {loading && !data && <LoadingBlock />}
      {data && data.length === 0 && <EmptyBlock title="No delivery areas yet. Customers can't check out until you add one." />}
      {data && data.length > 0 && (
        <ul className="divide-y divide-line border border-line bg-paper">
          {data.map((z) => (
            <li key={z.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-medium">{z.name}</p>
                <p className="text-sm text-muted tabular-nums">{formatUSD(z.feeCents)}</p>
              </div>
              {!z.isActive && <Badge>Hidden</Badge>}
              <Button size="sm" variant="ghost" onClick={() => setEditing(z)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleting(z)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ZoneModal
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
        title={`Delete ${deleting?.name ?? "area"}?`}
        message="Customers won't see it at checkout any more. Past orders keep the area name."
        confirmLabel="Delete"
        busy={remove.busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

export default function DeliveryZonesPage() {
  return (
    <OwnerOnly>
      <Zones />
    </OwnerOnly>
  );
}
