"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type AdminBrandRow,
  type AdminOrderRow,
  type Paginated,
} from "@latelylebanon/shared";
import { Field, Input, Select } from "@/components/ui/Field";
import { OrderList } from "@/components/admin/OrderList";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader, Pagination } from "@/components/admin/ui";
import { useAdminQuery } from "@/components/admin/use-admin-query";

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingBlock rows={6} />}>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const initial = useSearchParams();
  const [filters, setFilters] = useState({
    q: "",
    status: initial.get("status") ?? "",
    paymentMethod: "",
    brandId: "",
    from: "",
    to: "",
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const brands = useAdminQuery<AdminBrandRow[]>("/brands");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(filters.q), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const params = new URLSearchParams({ page: String(page) });
  for (const [key, value] of Object.entries({ ...filters, q: search })) if (value) params.set(key, value);
  const { data, error, loading, reload } = useAdminQuery<Paginated<AdminOrderRow>>(`/orders?${params}`);

  const set = (key: keyof typeof filters) => (value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader title="Orders" description="Newest first. Tap an order to see the details and move it along." />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Field label="Search" className="xl:col-span-2">
          <Input placeholder="Order number, name or phone" value={filters.q} onChange={(e) => set("q")(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={filters.status} onChange={(e) => set("status")(e.target.value)}>
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment">
          <Select value={filters.paymentMethod} onChange={(e) => set("paymentMethod")(e.target.value)}>
            <option value="">All</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Brand">
          <Select value={filters.brandId} onChange={(e) => set("brandId")(e.target.value)}>
            <option value="">All</option>
            {brands.data?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="From">
            <Input type="date" value={filters.from} onChange={(e) => set("from")(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={filters.to} onChange={(e) => set("to")(e.target.value)} />
          </Field>
        </div>
      </div>

      {error && <ErrorBlock message={error} onRetry={reload} />}
      {loading && !data && <LoadingBlock rows={6} />}
      {data && data.items.length === 0 && <EmptyBlock title={filtered ? "No orders match these filters." : "No orders yet."} />}
      {data && data.items.length > 0 && (
        <div className={loading ? "opacity-60" : ""}>
          <p className="mb-2 text-sm text-muted tabular-nums">
            {data.total} {data.total === 1 ? "order" : "orders"}
          </p>
          <OrderList orders={data.items} />
          <Pagination page={data.page} pageCount={data.pageCount} onPage={setPage} />
        </div>
      )}
    </>
  );
}
