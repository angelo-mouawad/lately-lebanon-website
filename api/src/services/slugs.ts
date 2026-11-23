import { slugify } from "@latelylebanon/shared";
import { conflict } from "../lib/errors";

/** Finds a free slug: "olive-soap", then "olive-soap-2", "olive-soap-3" and so on. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || "item";
  if (!(await exists(root))) return root;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${root}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw conflict("Please choose a different web address.");
}
