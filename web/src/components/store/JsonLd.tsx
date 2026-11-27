import { whatsappNumbers, type PublicProduct, type StoreSettings } from "@latelylebanon/shared";
import { SITE_URL } from "@/lib/config";

/** Structured data for search engines. `<` is escaped so content can't close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function organizationLd(settings: StoreSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: settings.storeName,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/lately-lebanon-logo-square.png`,
    email: settings.contactEmail,
    areaServed: { "@type": "Country", name: "Lebanon" },
    sameAs: settings.instagramUrl ? [settings.instagramUrl] : [],
    contactPoint: whatsappNumbers(settings).length
      ? whatsappNumbers(settings).map((telephone) => ({
          "@type": "ContactPoint",
          telephone,
          contactType: "customer service",
          availableLanguage: ["English", "Arabic", "French"],
        }))
      : [{ "@type": "ContactPoint", email: settings.contactEmail, contactType: "customer service", availableLanguage: ["English", "Arabic", "French"] }],
  };
}

const usd = (cents: number) => (cents / 100).toFixed(2);

export function productLd(p: PublicProduct) {
  const url = `${SITE_URL}/products/${p.slug}`;
  const prices = p.variants.map((v) => v.priceCents);
  const low = prices.length ? Math.min(...prices) : p.priceCents;
  const high = prices.length ? Math.max(...prices) : p.priceCents;
  const availability = p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.name,
        description: p.seoDescription ?? p.description,
        image: p.images.map((i) => i.lg),
        url,
        category: p.category.name,
        brand: { "@type": "Brand", name: p.brand.name },
        offers:
          low === high
            ? { "@type": "Offer", url, priceCurrency: "USD", price: usd(low), availability, itemCondition: "https://schema.org/NewCondition" }
            : { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: usd(low), highPrice: usd(high), offerCount: p.variants.length, availability },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/shop` },
          { "@type": "ListItem", position: 2, name: p.category.name, item: `${SITE_URL}/shop?category=${p.category.slug}` },
          { "@type": "ListItem", position: 3, name: p.name, item: url },
        ],
      },
    ],
  };
}
