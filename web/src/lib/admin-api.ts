"use client";

import { API_URL } from "./config";
import { ApiError, toApiError } from "./api-error";

let csrfToken = "";
let onUnauthorized: (() => void) | null = null;

/** Called by the auth provider once it knows the session's CSRF token. */
export function setAdminSession(token: string, handleUnauthorized: () => void) {
  csrfToken = token;
  onUnauthorized = handleUnauthorized;
}

interface Options {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Send FormData as is (for uploads). */
  form?: FormData;
}

/** Calls the admin API with the session cookie and CSRF header. */
export async function adminFetch<T>(path: string, { method = "GET", body, form }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (method !== "GET") headers["X-CSRF-Token"] = csrfToken;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}/admin${path}`, {
    method,
    headers,
    credentials: "include",
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    cache: "no-store",
  });

  if (res.status === 401 && !path.startsWith("/auth/login")) onUnauthorized?.();
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function adminUrl(path: string): string {
  return `${API_URL}/admin${path}`;
}

export { ApiError };
