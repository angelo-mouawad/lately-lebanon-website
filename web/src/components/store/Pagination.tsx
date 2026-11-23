import Link from "next/link";
import { fmt, getMessages } from "@/i18n";
import { buttonClass } from "@/components/ui/Button";

const t = getMessages();

/** Page links that keep the current filters, so every page has its own shareable URL. */
export function ShopPagination({
  page,
  pageCount,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    if (p > 1) qs.set("page", String(p));
    else qs.delete("page");
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <nav aria-label="Pages" className="mt-14 flex items-center justify-between gap-4 border-t border-line pt-6">
      {page > 1 ? (
        <Link href={href(page - 1)} className={buttonClass("secondary", "md")} rel="prev">
          {t.shop.previous}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted tabular-nums">{fmt(t.shop.page, { page, total: pageCount })}</span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={buttonClass("secondary", "md")} rel="next">
          {t.shop.next}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
