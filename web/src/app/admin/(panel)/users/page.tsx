"use client";

import { useState, type FormEvent } from "react";
import { adminUserCreateSchema, adminUserUpdateSchema, type AdminRole, type AdminUserRow } from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { zodFields } from "@/lib/zod-fields";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { OwnerOnly } from "@/components/admin/OwnerOnly";
import { formatDateTime } from "@/components/admin/status";
import { useToast } from "@/components/admin/Toast";
import { ErrorBlock, FormError, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";
import { useSave } from "@/components/admin/use-save";

interface Draft {
  id?: number;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  password: string;
}

const ROLE_HELP: Record<AdminRole, string> = {
  EDITOR: "Can manage products, brands, categories and orders.",
  OWNER: "Everything, including money, payouts, settings and the team.",
};

function UserModal({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useSave();
  const isNew = !d.id;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = isNew
      ? { name: d.name, email: d.email, role: d.role, password: d.password }
      : { name: d.name, role: d.role, isActive: d.isActive, password: d.password };
    const parsed = (isNew ? adminUserCreateSchema : adminUserUpdateSchema).safeParse(body);
    if (!parsed.success) return setErrors(zodFields(parsed.error));
    setErrors({});
    const ok = await save.run(() => (isNew ? adminFetch("/users", { method: "POST", body }) : adminFetch(`/users/${d.id}`, { method: "PUT", body })));
    if (ok) onSaved();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Add someone to the team" : `Edit ${d.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={save.busy}>
            Save
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <FormError message={save.error} />
        <Field label="Name" error={errors.name}>
          <Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} data-autofocus />
        </Field>
        {isNew && (
          <Field label="Email" hint="They log in with this." error={errors.email ?? save.fields.email}>
            <Input type="email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
          </Field>
        )}
        <Field label="Access" hint={ROLE_HELP[d.role]}>
          <Select value={d.role} onChange={(e) => setD({ ...d, role: e.target.value as AdminRole })}>
            <option value="EDITOR">Editor</option>
            <option value="OWNER">Owner</option>
          </Select>
        </Field>
        <Field
          label={isNew ? "Password" : "New password"}
          optional={!isNew}
          hint={isNew ? "At least 10 characters. Share it with them in person." : "Leave empty to keep their current password."}
          error={errors.password}
        >
          <Input type="password" autoComplete="new-password" value={d.password} onChange={(e) => setD({ ...d, password: e.target.value })} />
        </Field>
        {!isNew && (
          <Switch label="Can log in" description="Turn off when someone leaves the team." checked={d.isActive} onChange={(isActive) => setD({ ...d, isActive })} />
        )}
      </form>
    </Modal>
  );
}

function Users() {
  const { data, error, loading, reload } = useAdminQuery<AdminUserRow[]>("/users");
  const { notify } = useToast();
  const [editing, setEditing] = useState<Draft | null>(null);

  return (
    <>
      <PageHeader
        title="Team"
        description="People who can log in to this admin."
        actions={<Button onClick={() => setEditing({ name: "", email: "", role: "EDITOR", isActive: true, password: "" })}>Add someone</Button>}
      />
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {loading && !data && <LoadingBlock />}
      {data && (
        <ul className="divide-y divide-line border border-line bg-paper">
          {data.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{u.name}</p>
                <p className="truncate text-sm text-muted">
                  {u.email}
                  {u.lastLoginAt ? ` · last in ${formatDateTime(u.lastLoginAt)}` : " · never logged in"}
                </p>
              </div>
              <Badge tone={u.role === "OWNER" ? "ink" : "neutral"}>{u.role === "OWNER" ? "Owner" : "Editor"}</Badge>
              {!u.isActive && <Badge tone="danger">Can&apos;t log in</Badge>}
              <Button size="sm" variant="ghost" onClick={() => setEditing({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, password: "" })}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <UserModal
          draft={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            notify("Saved");
            reload();
          }}
        />
      )}
    </>
  );
}

export default function UsersPage() {
  return (
    <OwnerOnly>
      <Users />
    </OwnerOnly>
  );
}
