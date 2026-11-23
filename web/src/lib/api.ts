import "server-only";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { API_URL } from "./config";
import { toApiError } from "./api-error";

const INTERNAL_URL = (process.env.API_INTERNAL_URL || API_URL).replace(/\/$/, "");

/** Cache tags the API refreshes after admin edits. See api/src/services/revalidate.ts. */
export type CacheTag = "catalog" | "settings";

interface GetOptions {
  tags?: CacheTag[];
  /** Seconds to keep the response. Use false for data that must always be fresh. */
  revalidate?: number | false;
}

/**
 * Reads public data from the API on the server.
 * Pages render on request (so builds never depend on the API being up), but responses are
 * kept in Next's data cache and refreshed by tag, so most visits never reach the API.
 */
export async function apiGet<T>(path: string, { tags = ["catalog"], revalidate = 600 }: GetOptions = {}): Promise<T> {
  await connection();
  const res = await fetch(`${INTERNAL_URL}/public${path}`, {
    headers: { accept: "application/json" },
    ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate, tags } }),
  });
  if (res.status === 404) notFound();
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}
