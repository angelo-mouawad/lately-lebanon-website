import type { Metadata } from "next";
import { formatLebanesePhone, whatsappNumbers, type StoreSettings } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { pagesEn } from "@/i18n/pages.en";
import { apiGet } from "@/lib/api";
import { whatsappLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";
import { InfoPage } from "@/components/store/InfoPage";

const page = pagesEn.contact;
const t = getMessages();

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await apiGet<StoreSettings>("/settings", { tags: ["settings"] });
  const numbers = whatsappNumbers(settings);

  return (
    <InfoPage
      page={page}
      aside={
        <div className="flex flex-col gap-3">
          {numbers.map((n) => (
            <a
              key={n}
              href={whatsappLink(n, t.whatsapp.greeting)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center justify-center gap-3 border border-olive bg-olive px-6 text-sm tracking-wide text-paper hover:bg-ink hover:border-ink"
            >
              <WhatsAppIcon className="size-5" />
              {numbers.length > 1 ? `${t.whatsapp.button}: ${formatLebanesePhone(n)}` : t.whatsapp.button}
            </a>
          ))}
          <dl className="mt-4 flex flex-col gap-4 text-[15px]">
            <div>
              <dt className="label text-muted">WhatsApp</dt>
              {numbers.map((n) => (
                <dd key={n} className="tabular-nums">
                  {formatLebanesePhone(n)}
                </dd>
              ))}
            </div>
            <div>
              <dt className="label text-muted">Email</dt>
              <dd>
                <a href={`mailto:${settings.contactEmail}`} className="link-underline">
                  {settings.contactEmail}
                </a>
              </dd>
            </div>
            {settings.instagramUrl && (
              <div>
                <dt className="label text-muted">Instagram</dt>
                <dd>
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="link-underline">
                    {settings.instagramUrl.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      }
    />
  );
}
