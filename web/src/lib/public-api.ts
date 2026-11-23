"use client";

import type { CartQuoteInput, QuoteResult } from "@latelylebanon/shared";
import { API_URL } from "./config";
import { toApiError } from "./api-error";

/** Calls the public API from the browser (search, bag, checkout, tracking). */
export async function publicFetch<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(`${API_URL}/public${path}`, {
    method: init.method ?? "GET",
    headers: init.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: init.signal,
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

export const quoteCart = (input: CartQuoteInput, signal?: AbortSignal) =>
  publicFetch<QuoteResult>("/cart/quote", { method: "POST", body: input, signal });
