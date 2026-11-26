import Image from "next/image";
import Link from "next/link";
import type { HomeData, StoreSettings } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { apiGet } from "@/lib/api";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container, ProductGrid, SectionHeading } from "@/components/store/sections";

const t = getMessages();

export default async function HomePage() {
  const [home, settings] = await Promise.all([
    apiGet<HomeData>("/home"),
    apiGet<StoreSettings>("/settings", { tags: ["settings"] }),
  ]);

  return (
    <>
      {/* Hero */}
      <Container className="grid gap-8 pt-8 pb-16 lg:grid-cols-12 lg:gap-10 lg:pt-14 lg:pb-24">
        <div className="flex flex-col justify-end gap-6 lg:col-span-5 lg:pb-4">
          <p className="label text-terracotta">{t.home.kicker}</p>
          <h1 className="font-serif text-display">{settings.heroHeading}</h1>
          {settings.heroText && <p className="max-w-md text-[17px] leading-relaxed text-ink-soft">{settings.heroText}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink href="/shop" size="lg">
              {t.home.shopNow}
            </ButtonLink>
            <ButtonLink href="/brands" size="lg" variant="secondary">
              {t.home.meetBrands}
            </ButtonLink>
          </div>
        </div>
        <div className="relative aspect-[4/3] border border-ink bg-sand-deep lg:col-span-7 lg:aspect-auto lg:min-h-[560px]">
          {settings.heroImage && (
            <Image
              src={settings.heroImage.lg}
              alt={settings.heroImage.alt}
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
      </Container>

      {/* Featured brands */}
      {home.featuredBrands.length > 0 && (
        <Container className="pb-20">
          <SectionHeading
            title={t.home.featuredBrands}
            intro={t.home.featuredBrandsIntro}
            href="/brands"
            linkLabel={t.common.viewAll}
          />
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {home.featuredBrands.map((b) => (
              <li key={b.id} className="bg-sand">
                <Link href={`/brands/${b.slug}`} className="group flex h-full flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand-deep">
                    {b.cover && (
                      <Image
                        src={b.cover.lg}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <p className="font-serif text-2xl leading-tight">
                      <span className="link-underline">{b.name}</span>
                    </p>
                    <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{b.story}</p>
                    <p className="label mt-auto pt-3 text-muted">
                      {b.productCount === 1 ? t.brands.productsOne : fmt(t.brands.products, { count: b.productCount })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* Picked this month */}
      {home.featuredProducts.length > 0 && (
        <Container className="pb-20">
          <SectionHeading title={t.home.featured} href="/shop" linkLabel={t.common.viewAll} />
          {/* Full rows only: 4 or 8 picks, so the grid never ends with a gap. */}
          <ProductGrid products={home.featuredProducts.slice(0, home.featuredProducts.length >= 8 ? 8 : 4)} />
        </Container>
      )}

      {/* Categories */}
      {home.categories.length > 0 && (
        <Container className="pb-20">
          <SectionHeading title={t.home.shopByCategory} />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5">
            {home.categories.map((c) => (
              <li key={c.id}>
                <Link href={`/shop?category=${c.slug}`} className="group block">
                  <div className="relative aspect-4/5 overflow-hidden bg-sand-deep">
                    {c.image && (
                      <Image
                        src={c.image.lg}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-2 border-b border-ink py-3">
                    <span className="font-serif text-xl">{c.name}</span>
                    <span className="text-sm text-muted tabular-nums">{c.productCount}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* What is Lately Lebanon */}
      <section className="mb-20 border-y border-ink bg-paper">
        <Container className="grid gap-12 py-16 lg:grid-cols-12 lg:py-24">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">{t.home.aboutTitle}</h2>
            <div className="max-w-md border-l-2 border-terracotta pl-5">
              <p className="label mb-2 text-terracotta">{t.home.aboutLabel}</p>
              <p className="text-[17px] leading-relaxed text-ink-soft">{t.home.aboutText}</p>
            </div>
          </div>
          <ol className="lg:col-span-6 lg:col-start-7">
            {t.home.questions.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-line py-6 last:border-b">
                <span className="font-serif text-3xl text-terracotta tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="mb-2 text-lg font-medium">{step.title}</h3>
                  <p className="text-[15px] leading-relaxed text-ink-soft">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* New arrivals */}
      {home.newArrivals.length > 0 && (
        <Container className="pb-20">
          <SectionHeading title={t.home.newArrivals} href="/shop?sort=newest" linkLabel={t.common.viewAll} />
          <ProductGrid products={home.newArrivals} />
        </Container>
      )}

      {/* Instagram style grid */}
      {home.gallery.length > 0 && (
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t border-ink pt-5">
            <h2 className="font-serif text-3xl sm:text-4xl">{t.home.galleryTitle}</h2>
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="label link-underline inline-flex items-center gap-2 py-1">
                {t.home.galleryHandle} <ArrowRightIcon className="size-4 flip-rtl" />
              </a>
            )}
          </div>
          <ul className="grid grid-cols-3 gap-1 lg:grid-cols-6">
            {home.gallery.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.slug}`} className="group relative block aspect-square overflow-hidden bg-sand-deep">
                  {(p.hoverImage ?? p.image) && (
                    <Image
                      src={(p.hoverImage ?? p.image)!.md}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 16vw, 33vw"
                      className="object-cover transition-opacity duration-300 group-hover:opacity-80"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}
    </>
  );
}
