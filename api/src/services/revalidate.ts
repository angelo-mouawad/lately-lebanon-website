import { env } from "../lib/env";
import { logger } from "../lib/logger";

/**
 * Cache tags used by the storefront.
 * "catalog" covers products, brands, categories and the home page; "settings" covers
 * store settings, the announcement bar and delivery zones.
 */
export type CacheTag = "catalog" | "settings";

/** Asks the web app to refresh cached pages. Never throws: a failed call only delays the refresh. */
export function refreshWebsite(...tags: CacheTag[]): void {
  if (!env.REVALIDATE_URL || !env.REVALIDATE_SECRET) return;
  fetch(env.REVALIDATE_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-revalidate-secret": env.REVALIDATE_SECRET },
    body: JSON.stringify({ tags }),
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => {
      if (!res.ok) logger.warn("Website refresh failed", { status: res.status, tags });
    })
    .catch((err) => logger.warn("Website refresh failed", err));
}
