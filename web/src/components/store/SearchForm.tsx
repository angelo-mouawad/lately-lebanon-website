"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getMessages } from "@/i18n";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

const t = getMessages();

export function SearchForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function submit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form onSubmit={submit} role="search" className="flex gap-2">
      <Input
        type="search"
        aria-label={t.search.label}
        placeholder={t.search.placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        enterKeyHint="search"
      />
      <Button type="submit">{t.nav.search}</Button>
    </form>
  );
}
