import type { Metadata } from "next";
import Image from "next/image";
import type { PublicBrand, PublicProductCard } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { apiGet } from "@/lib/api";
import { InstagramIcon } from "@/components/ui/icons";
import { Container, ProductGrid, SectionHeading } from "@/components/store/sections";

const t = getMessages();

type Params = Promise<{ slug: string }>;
type BrandPage = PublicBrand & { products: PublicProductCard[] };

const getBrand = (slug: string) => apiGet<BrandPage>(`/brands/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const b = await getBrand((await params).slug);
  return {
    title: b.name,
    description: b.story.slice(0, 160),
    alternates: { canonical: `/brands/${b.slug}` },
    openGraph: { title: b.name, images: b.cover ? [{ url: b.cover.lg, width: b.cover.width, height: b.cover.height }] : [] },
  };
}

export default async function BrandPage({ params }: { params: Params }) {
  const brand = await getBrand((await params).slug);

  return (
    <>
      <div className="relative aspect-[16/9] max-h-[70vh] w-full border-b border-ink bg-sand-deep sm:aspect-[21/9]">
        {brand.cover && <Image src={brand.cover.lg} alt="" fill priority fetchPriority="high" sizes="100vw" className="object-cover" />}
      </div>
      <Container className="pt-10 lg:pt-14">
        <header className="grid gap-8 lg:grid-cols-12">
          <div className="flex items-start gap-5 lg:col-span-5">
            {brand.logo && (
              <div className="relative size-20 shrink-0 border border-ink bg-paper">
                <Image src={brand.logo.sm} alt={brand.logo.alt} fill sizes="80px" className="object-cover" />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <p className="label text-terracotta">{t.brands.kicker}</p>
              <h1 className="font-serif text-5xl leading-none sm:text-6xl">{brand.name}</h1>
              {brand.instagramUrl && (
                <a
                  href={brand.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label link-underline inline-flex items-center gap-2 self-start py-1"
                >
                  <InstagramIcon className="size-4" /> {t.brands.instagram}
                </a>
              )}
            </div>
          </div>
          <div className="prose-ll text-[17px] leading-relaxed text-ink-soft lg:col-span-6 lg:col-start-7">
            {brand.story.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </header>

        <section className="pt-16">
          <SectionHeading title={fmt(t.brands.shopAll, { brand: brand.name })} />
          {brand.products.length === 0 ? (
            <p className="text-[15px] text-muted">{t.brands.empty}</p>
          ) : (
            <ProductGrid products={brand.products} priorityCount={4} />
          )}
        </section>
      </Container>
    </>
  );
}
