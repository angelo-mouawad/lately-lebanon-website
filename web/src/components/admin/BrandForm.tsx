"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { brandSchema, formatUSD, slugify, type AdminBrand, type AdminDeliveryZone, type ImageSet } from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { SITE_URL } from "@/lib/config";
import { zodFields } from "@/lib/zod-fields";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Switch, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "./Toast";
import { Advanced, ErrorBlock, FormError, LoadingBlock, Section } from "./ui";
import { SingleImageUpload } from "./uploads";
import { useAdminQuery } from "./use-admin-query";
import { useSave } from "./use-save";

interface Draft {
  name: string;
  slug: string;
  logo: ImageSet | null;
  cover: ImageSet | null;
  story: string;
  instagramUrl: string;
  contactName: string;
  phone: string;
  email: string;
  commissionPct: number | null;
  ownDelivery: boolean;
  /** Delivery area id to the brand's price in cents. Missing or null: we deliver to that area. */
  deliveryFees: Record<number, number | null>;
  internalNotes: string;
  isActive: boolean;
}

const empty: Draft = {
  name: "",
  slug: "",
  logo: null,
  cover: null,
  story: "",
  instagramUrl: "",
  contactName: "",
  phone: "",
  email: "",
  commissionPct: 20,
  ownDelivery: false,
  deliveryFees: {},
  internalNotes: "",
  isActive: true,
};

function fromBrand(b: AdminBrand): Draft {
  return {
    name: b.name,
    slug: b.slug,
    logo: b.logo,
    cover: b.cover,
    story: b.story,
    instagramUrl: b.instagramUrl ?? "",
    contactName: b.contactName ?? "",
    phone: b.phone ?? "",
    email: b.email ?? "",
    commissionPct: b.commissionPct,
    ownDelivery: b.ownDelivery,
    deliveryFees: Object.fromEntries(b.deliveryFees.map((f) => [f.zoneId, f.feeCents])),
    internalNotes: b.internalNotes ?? "",
    isActive: b.isActive,
  };
}

function toInput(d: Draft) {
  return {
    name: d.name,
    slug: d.slug || null,
    logoKey: d.logo?.key ?? null,
    coverKey: d.cover?.key ?? null,
    story: d.story,
    instagramUrl: d.instagramUrl,
    contactName: d.contactName,
    phone: d.phone,
    email: d.email,
    commissionPct: d.commissionPct,
    ownDelivery: d.ownDelivery,
    deliveryFees: Object.entries(d.deliveryFees).flatMap(([zoneId, feeCents]) =>
      feeCents == null ? [] : [{ zoneId: Number(zoneId), feeCents }],
    ),
    internalNotes: d.internalNotes,
    isActive: d.isActive,
  };
}

/** The brand's own price for each of our delivery areas, laid out like the Delivery areas page. */
function BrandDeliveryPrices({
  fees,
  onChange,
  error,
}: {
  fees: Draft["deliveryFees"];
  onChange: (fees: Draft["deliveryFees"]) => void;
  error?: string;
}) {
  const zones = useAdminQuery<AdminDeliveryZone[]>("/delivery-areas");

  if (zones.error) return <ErrorBlock message={zones.error} onRetry={zones.reload} />;
  if (!zones.data) return <LoadingBlock rows={3} />;
  if (zones.data.length === 0) {
    return <p className="text-sm text-muted">There are no delivery areas yet. Add them on the Delivery areas page first.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Enter what the brand charges to deliver to each area. Leave an area empty if they don&apos;t deliver there: we&apos;ll deliver
        their products to that area at our usual price.
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ul className="divide-y divide-line border border-line bg-paper">
        {zones.data.map((z) => (
          <li key={z.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{z.name}</p>
              <p className="text-sm text-muted tabular-nums">Our price: {formatUSD(z.feeCents)}</p>
            </div>
            {!z.isActive && <Badge>Hidden</Badge>}
            <div className="w-36">
              <MoneyInput
                aria-label={`Brand's delivery price for ${z.name}`}
                placeholder="We deliver"
                value={fees[z.id] ?? null}
                onChange={(cents) => onChange({ ...fees, [z.id]: cents })}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BrandForm({ brand }: { brand: AdminBrand | null }) {
  const router = useRouter();
  const { notify } = useToast();
  const [draft, setDraft] = useState<Draft>(() => (brand ? fromBrand(brand) : empty));
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useSave();
  const errors = { ...save.fields, ...clientErrors };
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = brandSchema.safeParse(toInput(draft));
    if (!parsed.success) {
      const fields = zodFields(parsed.error);
      setClientErrors(fields);
      save.setError(Object.values(fields)[0] ?? "Please check the highlighted fields.");
      return;
    }
    setClientErrors({});
    const saved = await save.run(() =>
      brand
        ? adminFetch<AdminBrand>(`/brands/${brand.id}`, { method: "PUT", body: toInput(draft) })
        : adminFetch<AdminBrand>("/brands", { method: "POST", body: toInput(draft) }),
    );
    if (!saved) return;
    setDraft(fromBrand(saved));
    notify(brand ? "Saved" : "Brand added");
    if (!brand) router.replace(`/admin/brands/${saved.id}`);
  }

  async function remove() {
    if (!brand) return;
    const done = await save.run(async () => {
      await adminFetch(`/brands/${brand.id}`, { method: "DELETE" });
      return true;
    });
    setConfirmDelete(false);
    if (done) {
      notify("Brand deleted");
      router.push("/admin/brands");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="flex flex-col gap-6">
        <FormError message={save.error} />

        <Section title="On the website" description="This is what customers see on the brand's page.">
          <Field label="Brand name" error={errors.name}>
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Their story" hint="Who they are, where they work and how they make things. Keep it short and real." error={errors.story}>
            <Textarea rows={6} value={draft.story} onChange={(e) => set("story", e.target.value)} />
          </Field>
          <Field label="Instagram link" optional error={errors.instagramUrl}>
            <Input
              type="url"
              inputMode="url"
              placeholder="https://instagram.com/..."
              value={draft.instagramUrl}
              onChange={(e) => set("instagramUrl", e.target.value)}
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Logo</span>
              <SingleImageUpload value={draft.logo} onChange={(v) => set("logo", v)} kind="brand-logo" hint="Square works best." />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Cover photo</span>
              <SingleImageUpload
                value={draft.cover}
                onChange={(v) => set("cover", v)}
                kind="brand-cover"
                aspect="aspect-video"
                hint="A wide photo of their workshop or products."
              />
            </div>
          </div>
        </Section>

        <Section title="Private details" description="Only your team sees this. It's never shown on the website.">
          <Field
            label="Our commission (%)"
            hint="What we keep from each sale. You can change it for a single product too."
            error={errors.commissionPct}
            className="max-w-xs"
          >
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.5"
              value={draft.commissionPct ?? ""}
              onChange={(e) => set("commissionPct", e.target.value === "" ? null : Number(e.target.value))}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Contact person" optional error={errors.contactName}>
              <Input value={draft.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </Field>
            <Field label="Phone" optional error={errors.phone}>
              <Input type="tel" inputMode="tel" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email" optional error={errors.email}>
              <Input type="email" inputMode="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </div>
          <Field label="Notes" optional hint="Agreements, pickup address, anything to remember." error={errors.internalNotes}>
            <Textarea rows={4} value={draft.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} />
          </Field>
        </Section>

        <Section title="Delivery" description="Who takes this brand's orders to customers.">
          <Switch
            label="Brand has its own delivery service"
            description={
              draft.ownDelivery
                ? "They deliver their own products, at their prices below."
                : "We deliver their products, at the prices on the Delivery areas page."
            }
            checked={draft.ownDelivery}
            onChange={(on) => set("ownDelivery", on)}
          />
          {draft.ownDelivery && (
            <BrandDeliveryPrices
              fees={draft.deliveryFees}
              onChange={(fees) => set("deliveryFees", fees)}
              error={errors.deliveryFees ?? Object.entries(errors).find(([k]) => k.startsWith("deliveryFees."))?.[1]}
            />
          )}
        </Section>

        <Advanced>
          <Field
            label="Web address"
            hint={`${SITE_URL.replace(/^https?:\/\//, "")}/brands/${draft.slug || slugify(draft.name) || "..."}`}
            error={errors.slug}
          >
            <Input
              value={draft.slug}
              placeholder={slugify(draft.name)}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            />
          </Field>
        </Advanced>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <div className="flex flex-col gap-5 border border-line bg-paper p-5">
          <Switch
            label="Show on website"
            description={draft.isActive ? "The brand and its products are visible." : "Hidden, along with all its products."}
            checked={draft.isActive}
            onChange={(on) => set("isActive", on)}
          />
          <Button type="submit" loading={save.busy} block>
            {brand ? "Save changes" : "Add brand"}
          </Button>
        </div>
        {brand && (
          <div>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} disabled={save.busy}>
              Delete brand
            </Button>
          </div>
        )}
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this brand?"
        message="This only works for brands with no products and no orders. To take a brand off the website, turn off “Show on website” instead."
        confirmLabel="Delete"
        busy={save.busy}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  );
}
