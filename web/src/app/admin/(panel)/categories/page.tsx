"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { categorySchema, slugify, type AdminCategory, type ImageSet } from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { zodFields } from "@/lib/zod-fields";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/admin/Toast";
import { EmptyBlock, ErrorBlock, FormError, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { SingleImageUpload } from "@/components/admin/uploads";
import { useAdminQuery } from "@/components/admin/use-admin-query";
import { useSave } from "@/components/admin/use-save";

/** Main categories in order, each followed by its sub categories. */
function tree(list: AdminCategory[]) {
  const parents = list.filter((c) => !c.parentId);
  return parents.flatMap((p) => [p, ...list.filter((c) => c.parentId === p.id)]);
}

interface Draft {
  id?: number;
  name: string;
  slug: string;
  parentId: number | null;
  image: ImageSet | null;
  sortOrder: number;
}

function CategoryModal({
  draft,
  categories,
  onClose,
  onSaved,
}: {
  draft: Draft;
  categories: AdminCategory[];
  onClose: () => void;
  onSaved: (list: AdminCategory[]) => void;
}) {
  const [d, setD] = useState(draft);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const save = useSave();
  const errors = { ...save.fields, ...clientErrors };
  const hasChildren = d.id != null && categories.some((c) => c.parentId === d.id);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = { name: d.name, slug: d.slug || null, parentId: d.parentId, imageKey: d.image?.key ?? null, sortOrder: d.sortOrder };
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return setClientErrors(zodFields(parsed.error));
    setClientErrors({});
    const list = await save.run(() =>
      d.id
        ? adminFetch<AdminCategory[]>(`/categories/${d.id}`, { method: "PUT", body })
        : adminFetch<AdminCategory[]>("/categories", { method: "POST", body }),
    );
    if (list) onSaved(list);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={d.id ? "Edit category" : "Add a category"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={save.busy}>
            Save
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <FormError message={save.error} />
        <Field label="Name" error={errors.name}>
          <Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} data-autofocus />
        </Field>
        {!hasChildren && (
          <Field label="Inside another category" optional error={errors.parentId}>
            <Select value={d.parentId ?? ""} onChange={(e) => setD({ ...d, parentId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">No, it's a main category</option>
              {categories
                .filter((c) => !c.parentId && c.id !== d.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Photo</span>
          <SingleImageUpload value={d.image} onChange={(image) => setD({ ...d, image })} kind="category" aspect="aspect-4/5" />
        </div>
        <Field label="Web address" optional hint={`/shop?category=${d.slug || slugify(d.name) || "..."}`} error={errors.slug}>
          <Input
            value={d.slug}
            placeholder={slugify(d.name)}
            onChange={(e) => setD({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
          />
        </Field>
      </form>
    </Modal>
  );
}

export default function CategoriesPage() {
  const { data, setData, error, loading, reload } = useAdminQuery<AdminCategory[]>("/categories");
  const { notify } = useToast();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const action = useSave();

  const ordered = data ? tree(data) : [];

  async function move(category: AdminCategory, direction: -1 | 1) {
    const siblings = ordered.filter((c) => c.parentId === category.parentId);
    const index = siblings.findIndex((c) => c.id === category.id);
    const swapWith = siblings[index + direction];
    if (!swapWith || !data) return;
    const parents = data.filter((c) => !c.parentId);
    const reorder = (list: AdminCategory[]) =>
      list.map((c) => (c.id === category.id ? swapWith : c.id === swapWith.id ? category : c));
    const newParents = category.parentId ? parents : reorder(parents);
    const ids = newParents.flatMap((p) => {
      const kids = data.filter((c) => c.parentId === p.id);
      return [p.id, ...(category.parentId === p.id ? reorder(kids) : kids).map((k) => k.id)];
    });
    const list = await action.run(() => adminFetch<AdminCategory[]>("/categories/reorder", { method: "PUT", body: { ids } }));
    if (list) setData(list);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const list = await action.run(() => adminFetch<AdminCategory[]>(`/categories/${deleting.id}`, { method: "DELETE" }));
    setDeleting(null);
    if (list) {
      setData(list);
      notify("Category deleted");
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="How the shop is organised. Use the arrows to change the order customers see."
        actions={
          <Button onClick={() => setEditing({ name: "", slug: "", parentId: null, image: null, sortOrder: data?.length ?? 0 })}>
            Add a category
          </Button>
        }
      />
      {action.error && (
        <div className="mb-4">
          <FormError message={action.error} />
        </div>
      )}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {loading && !data && <LoadingBlock />}
      {data && data.length === 0 && <EmptyBlock title="No categories yet." />}
      {ordered.length > 0 && (
        <ul className={cn("divide-y divide-line border border-line bg-paper", action.busy && "opacity-60")}>
          {ordered.map((c) => {
            const siblings = ordered.filter((s) => s.parentId === c.parentId);
            const index = siblings.findIndex((s) => s.id === c.id);
            return (
              <li key={c.id} className={cn("flex items-center gap-3 p-3 sm:gap-4 sm:p-4", c.parentId != null && "pl-8 sm:pl-12")}>
                <div className="relative aspect-4/5 w-10 shrink-0 bg-sand-deep">
                  {c.image && <Image src={c.image.sm} alt="" fill sizes="40px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {c.productCount} {c.productCount === 1 ? "product" : "products"}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    className="p-2 hover:text-terracotta disabled:opacity-30"
                    disabled={index === 0 || action.busy}
                    onClick={() => void move(c, -1)}
                    aria-label={`Move ${c.name} up`}
                  >
                    <ArrowLeftIcon className="size-4 rotate-90" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:text-terracotta disabled:opacity-30"
                    disabled={index === siblings.length - 1 || action.busy}
                    onClick={() => void move(c, 1)}
                    aria-label={`Move ${c.name} down`}
                  >
                    <ArrowRightIcon className="size-4 rotate-90" />
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId, image: c.image, sortOrder: c.sortOrder })}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(c)}>
                  Delete
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {editing && data && (
        <CategoryModal
          draft={editing}
          categories={data}
          onClose={() => setEditing(null)}
          onSaved={(list) => {
            setData(list);
            setEditing(null);
            notify("Saved");
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? "category"}?`}
        message={
          deleting?.productCount
            ? `This category still has ${deleting.productCount} products. Move them to another category first.`
            : "This can't be undone."
        }
        confirmLabel="Delete"
        busy={action.busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
