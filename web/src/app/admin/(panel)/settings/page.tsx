"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  settingsSchema,
  type AdminBrandRow,
  type AdminProductRow,
  type AdminSettings,
  type ImageSet,
  type Paginated,
} from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { zodFields } from "@/lib/zod-fields";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Switch, Textarea } from "@/components/ui/Field";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "@/components/ui/icons";
import { OwnerOnly } from "@/components/admin/OwnerOnly";
import { useToast } from "@/components/admin/Toast";
import { ErrorBlock, FormError, LoadingBlock, PageHeader, Section } from "@/components/admin/ui";
import { SingleImageUpload } from "@/components/admin/uploads";
import { useAdminQuery } from "@/components/admin/use-admin-query";
import { useSave } from "@/components/admin/use-save";

interface Pickable {
  id: number;
  name: string;
  image: ImageSet | null;
}

/** An ordered list of picks with arrows to reorder and a search box to add more. */
function OrderedPicker({
  selected,
  options,
  onChange,
  max,
  search,
  emptyText,
}: {
  selected: number[];
  options: Pickable[];
  onChange: (ids: number[]) => void;
  max: number;
  search?: ReactNode;
  emptyText: string;
}) {
  const byId = new Map(options.map((o) => [o.id, o]));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= selected.length) return;
    const next = [...selected];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id!);
    onChange(next);
  };
  const available = options.filter((o) => !selected.includes(o.id));

  return (
    <div className="flex flex-col gap-4">
      {selected.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <ol className="divide-y divide-line border border-line">
          {selected.map((id, i) => {
            const item = byId.get(id);
            return (
              <li key={id} className="flex items-center gap-3 p-2">
                <span className="w-6 text-center text-sm text-muted tabular-nums">{i + 1}</span>
                <div className="relative size-10 shrink-0 bg-sand-deep">
                  {item?.image && <Image src={item.image.sm} alt="" fill sizes="40px" className="object-cover" />}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm">{item?.name ?? `#${id}`}</span>
                <button type="button" className="p-2 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                  <ArrowLeftIcon className="size-4 rotate-90" />
                </button>
                <button type="button" className="p-2 disabled:opacity-30" disabled={i === selected.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
                  <ArrowRightIcon className="size-4 rotate-90" />
                </button>
                <button type="button" className="p-2 text-danger" onClick={() => onChange(selected.filter((x) => x !== id))} aria-label={`Remove ${item?.name ?? id}`}>
                  <CloseIcon className="size-4" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {selected.length < max && (
        <div className="flex flex-col gap-2">
          {search}
          {available.length > 0 && (
            <ul className="flex max-h-56 flex-col overflow-y-auto border border-line">
              {available.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => onChange([...selected, o.id])} className="flex w-full items-center gap-3 p-2 text-left text-sm hover:bg-sand">
                    <span className="text-muted">Add</span> {o.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsForm({ initial }: { initial: AdminSettings }) {
  const { notify } = useToast();
  const save = useSave();
  const [s, setS] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState("");
  const [query, setQuery] = useState("");
  const brands = useAdminQuery<AdminBrandRow[]>("/brands");
  const products = useAdminQuery<Paginated<AdminProductRow>>(`/products?status=PUBLISHED${query ? `&q=${encodeURIComponent(query)}` : ""}`);
  const [knownProducts, setKnownProducts] = useState<Map<number, Pickable>>(new Map());

  useEffect(() => {
    const timer = setTimeout(() => setQuery(productSearch), 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Remember every product we've seen, so picks stay labelled when the search changes.
  useEffect(() => {
    if (!products.data) return;
    setKnownProducts((m) => {
      const next = new Map(m);
      for (const p of products.data!.items) next.set(p.id, { id: p.id, name: p.name, image: p.image });
      return next;
    });
  }, [products.data]);

  // Make sure products already picked have a label even if they aren't in the current search.
  useEffect(() => {
    const missing = initial.featuredProductIds.filter((id) => !knownProducts.has(id));
    if (missing.length === 0) return;
    Promise.all(missing.map((id) => adminFetch<{ id: number; name: string; images: ImageSet[] }>(`/products/${id}`).catch(() => null))).then(
      (rows) =>
        setKnownProducts((m) => {
          const next = new Map(m);
          for (const r of rows) if (r) next.set(r.id, { id: r.id, name: r.name, image: r.images[0] ?? null });
          return next;
        }),
    );
    // Runs once, for the picks saved before this page opened.
  }, []);

  const set = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => setS((prev) => ({ ...prev, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = {
      storeName: s.storeName,
      whatsappNumber: s.whatsappNumber,
      contactEmail: s.contactEmail,
      instagramUrl: s.instagramUrl ?? "",
      freeDeliveryThresholdCents: s.freeDeliveryThresholdCents,
      announcementText: s.announcementText ?? "",
      announcementActive: s.announcementActive,
      heroHeading: s.heroHeading,
      heroText: s.heroText,
      heroImageKey: s.heroImage?.key ?? null,
      featuredBrandIds: s.featuredBrandIds,
      featuredProductIds: s.featuredProductIds,
    };
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      const fields = zodFields(parsed.error);
      setErrors(fields);
      save.setError(Object.values(fields)[0] ?? null);
      return;
    }
    setErrors({});
    const saved = await save.run(() => adminFetch<AdminSettings>("/settings", { method: "PUT", body }));
    if (saved) {
      setS(saved);
      notify("Saved. The website updates in a few seconds.");
    }
  }

  const brandOptions: Pickable[] = (brands.data ?? []).map((b) => ({ id: b.id, name: b.name, image: b.logo }));
  const productOptions: Pickable[] = [
    ...new Map([...knownProducts].filter(([id]) => s.featuredProductIds.includes(id))).values(),
    ...(products.data?.items ?? []).map((p) => ({ id: p.id, name: p.name, image: p.image })),
  ];

  return (
    <form onSubmit={submit} noValidate className="flex max-w-3xl flex-col gap-6">
      <FormError message={save.error} />

      <Section title="Announcement bar" description="The thin strip at the very top of every page.">
        <Switch label="Show the announcement bar" checked={s.announcementActive} onChange={(v) => set("announcementActive", v)} />
        <Field label="Text" error={errors.announcementText}>
          <Input value={s.announcementText ?? ""} onChange={(e) => set("announcementText", e.target.value)} placeholder="Free delivery anywhere in Lebanon on orders over $75" />
        </Field>
      </Section>

      <Section title="Home page" description="The first thing visitors see.">
        <Field label="Big heading" error={errors.heroHeading}>
          <Input value={s.heroHeading} onChange={(e) => set("heroHeading", e.target.value)} />
        </Field>
        <Field label="Text under the heading" optional error={errors.heroText}>
          <Textarea rows={3} value={s.heroText} onChange={(e) => set("heroText", e.target.value)} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Main photo</span>
          <SingleImageUpload value={s.heroImage} onChange={(v) => set("heroImage", v)} kind="hero" aspect="aspect-4/3" hint="A wide photo, at least 1600 px across." />
        </div>
      </Section>

      <Section title="Featured makers" description="Shown on the home page, in this order. Leave empty to show the first four brands.">
        <OrderedPicker
          selected={s.featuredBrandIds}
          options={brandOptions}
          onChange={(ids) => set("featuredBrandIds", ids)}
          max={12}
          emptyText="No makers picked."
        />
      </Section>

      <Section title="Picked this month" description="Products shown on the home page, in this order. Leave empty to use products marked “Feature on home page”.">
        <OrderedPicker
          selected={s.featuredProductIds}
          options={productOptions}
          onChange={(ids) => set("featuredProductIds", ids)}
          max={24}
          emptyText="No products picked."
          search={<Input aria-label="Search products to add" placeholder="Search products to add" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />}
        />
      </Section>

      <Section title="Shop details">
        <Field label="Shop name" error={errors.storeName}>
          <Input value={s.storeName} onChange={(e) => set("storeName", e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="WhatsApp number" hint="Used for the WhatsApp buttons on the website." error={errors.whatsappNumber}>
            <Input type="tel" value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} />
          </Field>
          <Field label="Contact email" error={errors.contactEmail}>
            <Input type="email" value={s.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
        </div>
        <Field label="Instagram link" optional error={errors.instagramUrl}>
          <Input type="url" value={s.instagramUrl ?? ""} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/latelylebanon" />
        </Field>
        <Field label="Free delivery from" optional hint="Orders at or above this amount (after discounts) ship free. Leave empty to always charge delivery." error={errors.freeDeliveryThresholdCents}>
          <MoneyInput value={s.freeDeliveryThresholdCents} onChange={(v) => set("freeDeliveryThresholdCents", v)} />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper/95 px-4 py-4 sm:mx-0 sm:border sm:px-5">
        <Button type="submit" loading={save.busy}>
          Save settings
        </Button>
      </div>
    </form>
  );
}

function Settings() {
  const { data, error, loading, reload } = useAdminQuery<AdminSettings>("/settings");
  return (
    <>
      <PageHeader title="Homepage and shop" description="The announcement bar, home page and the shop's contact details." />
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {loading && !data && <LoadingBlock rows={6} />}
      {data && <SettingsForm initial={data} />}
    </>
  );
}

export default function SettingsPage() {
  return (
    <OwnerOnly>
      <Settings />
    </OwnerOnly>
  );
}
