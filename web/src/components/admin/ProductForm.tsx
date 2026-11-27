"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  excerpt,
  productSchema,
  slugify,
  type AdminBrandRow,
  type AdminCategory,
  type AdminProduct,
  type PublicProductCard,
} from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { SITE_URL } from "@/lib/config";
import { zodFields } from "@/lib/zod-fields";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Select, Switch, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Modal";
import { ProductCard } from "@/components/store/ProductCard";
import { draftFromProduct, draftToInput, emptyDraft, type ProductDraft } from "./product-form-utils";
import { useToast } from "./Toast";
import { Advanced, FormError, Section } from "./ui";
import { PhotoManager } from "./uploads";
import { useAdminQuery } from "./use-admin-query";
import { useSave } from "./use-save";
import { StockCodesEditor, VariantsEditor } from "./VariantsEditor";

export function ProductForm({ product }: { product: AdminProduct | null }) {
  const router = useRouter();
  const { notify } = useToast();
  const [draft, setDraft] = useState<ProductDraft>(() => (product ? draftFromProduct(product) : emptyDraft));
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [confirmArchive, setConfirmArchive] = useState(false);
  const save = useSave();
  const brands = useAdminQuery<AdminBrandRow[]>("/brands");
  const categories = useAdminQuery<AdminCategory[]>("/categories");

  const errors = { ...save.fields, ...clientErrors };
  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const brand = brands.data?.find((b) => b.id === draft.brandId);
  const category = categories.data?.find((c) => c.id === draft.categoryId);
  const isArchived = draft.status === "ARCHIVED";

  const preview: PublicProductCard = useMemo(() => {
    const prices = draft.variants.map((v) => v.priceCents ?? draft.priceCents ?? 0);
    const min = prices.length ? Math.min(...prices) : (draft.priceCents ?? 0);
    return {
      id: product?.id ?? 0,
      name: draft.name || "Product name",
      slug: draft.slug || "preview",
      priceCents: min,
      compareAtCents: draft.compareAtCents,
      priceVaries: new Set(prices).size > 1,
      inStock: draft.variants.some((v) => (v.stock ?? 0) > 0),
      image: draft.images[0] ?? null,
      hoverImage: null,
      brand: { name: brand?.name ?? "Brand", slug: "" },
      category: { name: category?.name ?? "", slug: "" },
      createdAt: new Date().toISOString(),
    };
  }, [draft, brand, category, product?.id]);

  async function submit(e?: FormEvent, statusOverride?: ProductDraft["status"]) {
    e?.preventDefault();
    const next = statusOverride ? { ...draft, status: statusOverride } : draft;
    const parsed = productSchema.safeParse(draftToInput(next));
    if (!parsed.success) {
      const fields = zodFields(parsed.error);
      setClientErrors(fields);
      save.setError(Object.values(fields)[0] ?? "Please check the highlighted fields.");
      return;
    }
    setClientErrors({});
    const saved = await save.run(() =>
      product
        ? adminFetch<AdminProduct>(`/products/${product.id}`, { method: "PUT", body: draftToInput(next) })
        : adminFetch<AdminProduct>("/products", { method: "POST", body: draftToInput(next) }),
    );
    if (!saved) return;
    setDraft(draftFromProduct(saved));
    notify(product ? "Saved" : "Product added");
    if (!product) router.replace(`/admin/products/${saved.id}`);
  }

  async function duplicate() {
    if (!product) return;
    const copy = await save.run(() => adminFetch<AdminProduct>(`/products/${product.id}/duplicate`, { method: "POST" }));
    if (copy) {
      notify("Copy created. It's hidden until you show it on the website.");
      router.push(`/admin/products/${copy.id}`);
    }
  }

  async function archive() {
    if (!product) return;
    const done = await save.run(async () => {
      await adminFetch(`/products/${product.id}/archive`, { method: "POST" });
      return true;
    });
    setConfirmArchive(false);
    if (done) {
      notify("Product archived");
      router.push("/admin/products");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="flex flex-col gap-6">
        <FormError message={save.error} />

        {isArchived && (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-line-strong bg-sand p-4 text-sm">
            <span>This product is archived. It isn't shown in the shop and can't be ordered.</span>
            <Button size="sm" variant="secondary" onClick={() => void submit(undefined, "DRAFT")}>
              Restore as hidden
            </Button>
          </div>
        )}

        <Section title="Basics">
          <Field label="Product name" error={errors.name}>
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="For example Pure Olive Oil Soap" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Brand" error={errors.brandId}>
              <Select
                value={draft.brandId ?? ""}
                onChange={(e) => set("brandId", e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Choose a brand</option>
                {brands.data?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.isActive ? "" : " (hidden)"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category" error={errors.categoryId}>
              <Select
                value={draft.categoryId ?? ""}
                onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Choose a category</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `  ${c.name}` : c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Description"
            hint="What it is, how it's made, what it's for. Two or three short paragraphs is plenty."
            error={errors.description}
          >
            <Textarea rows={6} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </Section>

        <Section title="Price">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Price" error={errors.priceCents}>
              <MoneyInput value={draft.priceCents} onChange={(v) => set("priceCents", v)} />
            </Field>
            <Field
              label="Old price"
              optional
              hint="Fill this in only when the product is on sale. It's shown crossed out."
              error={errors.compareAtCents}
            >
              <MoneyInput value={draft.compareAtCents} onChange={(v) => set("compareAtCents", v)} />
            </Field>
            <Field
              label="Weight (grams)"
              optional
              hint="Shown on the product page, for example 250 for a 250 g jar. Leave empty if it comes in different sizes."
              error={errors.weightGrams}
            >
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={draft.weightGrams}
                onChange={(e) => set("weightGrams", e.target.value)}
                placeholder="250"
              />
            </Field>
          </div>
        </Section>

        <Section title="Photos" description="The first photo is the one people see in the shop.">
          <PhotoManager
            photos={draft.images}
            onChange={(images) => set("images", images)}
            productName={draft.name}
            error={errors.images}
          />
        </Section>

        <Section title="Sizes and colours" description="Only needed if this product comes in different versions.">
          <VariantsEditor
            options={draft.options}
            variants={draft.variants}
            basePriceCents={draft.priceCents}
            errors={errors}
            onChange={(options, variants) => setDraft((d) => ({ ...d, options, variants }))}
          />
        </Section>

        <Advanced>
          <Field
            label="Web address"
            hint={`${SITE_URL.replace(/^https?:\/\//, "")}/products/${draft.slug || slugify(draft.name) || "..."}`}
            error={errors.slug}
          >
            <Input
              value={draft.slug}
              placeholder={slugify(draft.name)}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            />
          </Field>
          <Field label="Search engine title" optional hint="Shown in Google results. Leave empty to use the product name." error={errors.seoTitle}>
            <Input value={draft.seoTitle} placeholder={draft.name} onChange={(e) => set("seoTitle", e.target.value)} />
          </Field>
          <Field
            label="Search engine description"
            optional
            hint="One or two sentences for Google. Leave empty to use the start of the description."
            error={errors.seoDescription}
          >
            <Textarea
              rows={3}
              value={draft.seoDescription}
              placeholder={excerpt(draft.description)}
              onChange={(e) => set("seoDescription", e.target.value)}
            />
          </Field>
          <Field label="Tags" optional hint="Words people might search for, separated by commas." error={errors.tags}>
            <Input value={draft.tags} onChange={(e) => set("tags", e.target.value)} placeholder="soap, olive oil, gift" />
          </Field>
          <Field
            label="Our commission on this product (%)"
            optional
            hint={brand ? `Leave empty to use ${brand.name}'s usual ${brand.commissionPct}%.` : "Leave empty to use the brand's usual commission."}
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
          <StockCodesEditor options={draft.options} variants={draft.variants} onChange={(variants) => set("variants", variants)} />
        </Advanced>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <div className="flex flex-col gap-5 border border-line bg-paper p-5">
          {!isArchived && (
            <Switch
              label="Show on website"
              description={draft.status === "PUBLISHED" ? "Customers can see and buy it." : "Hidden. Only you can see it."}
              checked={draft.status === "PUBLISHED"}
              onChange={(on) => set("status", on ? "PUBLISHED" : "DRAFT")}
            />
          )}
          <Switch
            label="Feature on home page"
            description="Shown in “Picked this month” when no picks are set in homepage settings."
            checked={draft.featured}
            onChange={(on) => set("featured", on)}
          />
          <Button type="submit" loading={save.busy} block>
            {product ? "Save changes" : "Add product"}
          </Button>
          {product && draft.status === "PUBLISHED" && (
            <Link href={`/products/${draft.slug}`} target="_blank" className="text-center text-sm underline underline-offset-4">
              View in shop
            </Link>
          )}
        </div>

        <div className="border border-line bg-paper p-5">
          <p className="label mb-3 text-muted">Preview</p>
          <div className="mx-auto max-w-[220px]">
            <ProductCard product={preview} preview sizes="220px" />
          </div>
          {draft.status !== "PUBLISHED" && (
            <div className="mt-3">
              <Badge>{isArchived ? "Archived" : "Hidden"}</Badge>
            </div>
          )}
        </div>

        {product && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => void duplicate()} disabled={save.busy}>
              Duplicate
            </Button>
            {!isArchived && (
              <Button variant="danger" size="sm" onClick={() => setConfirmArchive(true)} disabled={save.busy}>
                Archive
              </Button>
            )}
          </div>
        )}
      </aside>

      <ConfirmDialog
        open={confirmArchive}
        title="Archive this product?"
        message="It will disappear from the shop and can't be ordered. Past orders keep it. You can restore it later from the archived list."
        confirmLabel="Archive"
        busy={save.busy}
        onConfirm={() => void archive()}
        onCancel={() => setConfirmArchive(false)}
      />
    </form>
  );
}
