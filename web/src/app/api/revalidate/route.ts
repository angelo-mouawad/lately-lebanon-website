import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED = new Set(["catalog", "settings"]);

function sameSecret(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Called by the API after admin edits so cached storefront pages refresh straight away. */
export async function POST(req: NextRequest) {
  if (!sameSecret(req.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { tags?: unknown };
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string" && ALLOWED.has(t)) : [];
  for (const tag of tags) revalidateTag(tag);
  return NextResponse.json({ revalidated: tags });
}
