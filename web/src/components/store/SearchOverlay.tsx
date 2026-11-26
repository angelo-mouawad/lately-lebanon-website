"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { formatUSD, type SearchSuggestion } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { publicFetch } from "@/lib/public-api";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDialog } from "@/components/ui/use-dialog";

const t = getMessages();

/** Search that shows results as you type, with a link to the full results page. */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const ref = useDialog<HTMLDivElement>(open, onClose);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const inputId = useId();
  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) {
      setResults(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      publicFetch<SearchSuggestion>(`/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then(setResults)
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!term) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  if (!open || typeof document === "undefined") return null;

  const empty = results && results.products.length === 0 && results.brands.length === 0;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t.search.label}
        className="relative max-h-dvh animate-fade-in overflow-y-auto border-b border-ink bg-sand"
      >
        <form onSubmit={submit} role="search" className="mx-auto flex max-w-[1440px] items-center gap-3 border-b border-line px-4 sm:px-6 lg:px-10">
          <SearchIcon className="size-6 shrink-0" />
          <label htmlFor={inputId} className="sr-only">
            {t.search.label}
          </label>
          <input
            id={inputId}
            data-autofocus
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search.placeholder}
            className="h-20 w-full bg-transparent font-serif text-2xl placeholder:text-muted/70 focus:outline-none sm:text-3xl"
          />
          <button type="button" onClick={onClose} className="-mr-2 p-2" aria-label={t.nav.close}>
            <CloseIcon className="size-6" />
          </button>
        </form>

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10" aria-live="polite">
          {term.length > 0 && term.length < 2 && <p className="text-sm text-muted">{t.search.typeMore}</p>}
          {loading && !results && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-4/5" />
              ))}
            </div>
          )}
          {empty && <p className="text-[15px]">{fmt(t.search.noResults, { q: term })}</p>}
          {results && !empty && (
            <div className="flex flex-col gap-8">
              {results.brands.length > 0 && (
                <div>
                  <p className="label mb-3 text-muted">{t.search.brands}</p>
                  <ul className="flex flex-wrap gap-2">
                    {results.brands.map((b) => (
                      <li key={b.slug}>
                        <Link href={`/brands/${b.slug}`} onClick={onClose} className="inline-block border border-ink px-3 py-1.5 text-sm hover:bg-ink hover:text-paper">
                          {b.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.products.length > 0 && (
                <div>
                  <p className="label mb-3 text-muted">{t.search.products}</p>
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {results.products.map((p) => (
                      <li key={p.id}>
                        <Link href={`/products/${p.slug}`} onClick={onClose} className="group block">
                          <div className="relative aspect-4/5 bg-sand-deep">
                            {p.image && <Image src={p.image.md} alt="" fill sizes="200px" className="object-cover" />}
                          </div>
                          <p className="mt-2 text-sm leading-snug group-hover:underline">{p.name}</p>
                          <p className="text-sm text-muted tabular-nums">{formatUSD(p.priceCents)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button type="button" onClick={submit} className="label link-underline self-start py-1">
                {t.search.seeAll}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
