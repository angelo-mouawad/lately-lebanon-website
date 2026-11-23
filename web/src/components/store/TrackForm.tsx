"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { trackOrderSchema, type TrackedOrder } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { errorMessage } from "@/lib/api-error";
import { publicFetch } from "@/lib/public-api";
import { zodFields } from "@/lib/zod-fields";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { OrderStatusView } from "./OrderStatusView";

const t = getMessages();

export function TrackForm() {
  const params = useSearchParams();
  const [number, setNumber] = useState(params.get("number") ?? "");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = trackOrderSchema.safeParse({ number, phone });
    if (!parsed.success) {
      setErrors(zodFields(parsed.error));
      return;
    }
    setErrors({});
    setError(null);
    setBusy(true);
    try {
      setOrder(await publicFetch<TrackedOrder>("/orders/track", { method: "POST", body: parsed.data }));
    } catch (err) {
      setOrder(null);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5 border-t border-ink pt-6">
        {error && (
          <div role="alert" className="border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.track.number} error={errors.number}>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t.track.numberPlaceholder} autoCapitalize="characters" />
          </Field>
          <Field label={t.track.phone} error={errors.phone}>
            <Input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="70 123 456" />
          </Field>
        </div>
        <div>
          <Button type="submit" loading={busy}>
            {t.track.submit}
          </Button>
        </div>
      </form>
      {order && <OrderStatusView order={order} />}
    </div>
  );
}
