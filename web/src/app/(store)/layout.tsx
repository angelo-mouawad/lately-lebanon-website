import { whatsappNumbers, type PublicCategory, type StoreSettings } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { apiGet } from "@/lib/api";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { JsonLd, organizationLd } from "@/components/store/JsonLd";
import { WhatsAppButton } from "@/components/store/WhatsAppButton";

const t = getMessages();

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    apiGet<StoreSettings>("/settings", { tags: ["settings"] }),
    apiGet<PublicCategory[]>("/categories"),
  ]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        {t.nav.skipToContent}
      </a>
      {settings.announcementActive && settings.announcementText && (
        <div className="bg-ink px-4 py-2.5 text-center text-xs tracking-[0.08em] text-paper">{settings.announcementText}</div>
      )}
      <Header categories={categories} storeName={settings.storeName} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer />
      <WhatsAppButton numbers={whatsappNumbers(settings)} />
      <JsonLd data={organizationLd(settings)} />
    </>
  );
}
