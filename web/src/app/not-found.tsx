import Link from "next/link";
import { getMessages } from "@/i18n";
import { buttonClass } from "@/components/ui/Button";

const t = getMessages();

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-[70dvh] max-w-[1440px] flex-col justify-center gap-6 px-4 py-20 sm:px-6 lg:px-10">
      <p className="label text-terracotta">404</p>
      <h1 className="max-w-3xl font-serif text-display">{t.errors.notFoundTitle}</h1>
      <p className="max-w-md text-[17px] text-ink-soft">{t.errors.notFoundText}</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/shop" className={buttonClass("primary", "lg")}>
          {t.nav.shop}
        </Link>
        <Link href="/" className={buttonClass("secondary", "lg")}>
          {t.meta.title}
        </Link>
      </div>
    </main>
  );
}
