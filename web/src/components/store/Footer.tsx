import Link from "next/link";
import { formatLebanesePhone, type PublicCategory, type StoreSettings } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { whatsappLink } from "@/lib/whatsapp";

const t = getMessages();

export function Footer({ settings, categories }: { settings: StoreSettings; categories: PublicCategory[] }) {
  const columns = [
    {
      title: t.footer.shop,
      links: [
        { href: "/shop", label: t.nav.allProducts },
        ...categories.map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
        { href: "/brands", label: t.nav.brands },
      ],
    },
    {
      title: t.footer.help,
      links: [
        { href: "/track", label: t.footer.track },
        { href: "/faq", label: t.footer.faq },
        { href: "/returns", label: t.footer.returns },
        { href: "/contact", label: t.footer.contact },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { href: "/about", label: t.nav.about },
        { href: "/terms", label: t.footer.terms },
        { href: "/privacy", label: t.footer.privacy },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-ink bg-sand">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-10">
        <div className="flex max-w-sm flex-col gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, no resizing needed */}
          <img
            src="/brand/lately-lebanon-logo.png"
            alt={`${settings.storeName}, a curated marketplace`}
            width={1616}
            height={348}
            loading="lazy"
            className="h-auto w-64 max-w-full"
          />
          <p className="text-[15px] leading-relaxed text-ink-soft">{t.footer.about}</p>
          <div className="flex flex-col gap-1 text-sm">
            <a href={whatsappLink(settings.whatsappNumber, t.whatsapp.greeting)} className="link-underline self-start">
              {t.footer.whatsapp}: {formatLebanesePhone(settings.whatsappNumber)}
            </a>
            <a href={`mailto:${settings.contactEmail}`} className="link-underline self-start">
              {settings.contactEmail}
            </a>
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="link-underline self-start">
                Instagram
              </a>
            )}
          </div>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="label mb-4 text-muted">{col.title}</p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline text-[15px]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1440px] px-4 py-5 text-xs text-muted sm:px-6 lg:px-10">
          {new Date().getFullYear()} {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
