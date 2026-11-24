"use client";

import { useState, type FormEvent } from "react";
import { changePasswordSchema } from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { zodFields } from "@/lib/zod-fields";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useAuth } from "@/components/admin/AuthProvider";
import { useToast } from "@/components/admin/Toast";
import { FormError, PageHeader, Section } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";

export default function AccountPage() {
  const { me } = useAuth();
  const { notify } = useToast();
  const save = useSave();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    const fields = parsed.success ? {} : zodFields(parsed.error);
    if (newPassword && repeat !== newPassword) fields.repeat = "The two new passwords don't match";
    if (Object.keys(fields).length) return setErrors(fields);
    setErrors({});
    const ok = await save.run(async () => {
      await adminFetch("/auth/password", { method: "POST", body: { currentPassword, newPassword } });
      return true;
    });
    if (ok) {
      setCurrent("");
      setNew("");
      setRepeat("");
      notify("Password changed. Other devices have been logged out.");
    }
  }

  return (
    <>
      <PageHeader title="My password" description={`Logged in as ${me.email}`} />
      <form onSubmit={submit} noValidate className="max-w-md">
        <Section>
          <FormError message={save.error} />
          <Field label="Current password" error={errors.currentPassword ?? save.fields.currentPassword}>
            <Input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label="New password" hint="At least 10 characters." error={errors.newPassword}>
            <Input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} />
          </Field>
          <Field label="New password again" error={errors.repeat}>
            <Input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
          </Field>
          <div>
            <Button type="submit" loading={save.busy}>
              Change password
            </Button>
          </div>
        </Section>
      </form>
    </>
  );
}
