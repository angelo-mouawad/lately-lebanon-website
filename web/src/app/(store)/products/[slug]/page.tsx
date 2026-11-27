import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { excerpt, formatWeight, type PublicProduct, type PublicProductCard, type StoreSettings } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { apiGet } from "@/lib/api";
import { JsonLd, productLd } from "@/components/store/JsonLd";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductPurchase } from "@/components/store/ProductPurchase";
import { RecentlyViewed } from "@/components/store/RecentlyViewed";
import { Container, ProductGrid, SectionHeading } from "@/components/store/sections";

const t = getMessages();

type Params = Promise<{ slug: string }>;

const getProduct = (slug: string) => apiGet<PublicProduct>(`/products/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  const description = p.seoDescription ?? excerpt(p.description);
  return {
    title: p.seoTitle ?? `${p.name} by ${p.brand.name}`,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      images: p.images[0] ? [{ url: p.images[0].lg, width: p.images[0].width, height: p.images[0].height, alt: p.name }] : [],
    },
  };
}

function toCard(p: PublicProduct): PublicProductCard {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    priceVaries: p.priceVaries,
    inStock: p.inStock,
    image: p.images[0] ?? null,
    hoverImage: p.images[1] ?? null,
    brand: { name: p.brand.name, slug: p.brand.slug },
    category: p.category,
    createdAt: p.createdAt,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), apiGet<StoreSettings>("/settings", { tags: ["settings"] })]);
  const card = toCard(product);

  return (
    <Container className="pt-6 lg:pt-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/shop" className="link-underline">
              {t.nav.shop}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/shop?category=${product.category.slug}`} className="link-underline">
              {product.category.name}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="flex flex-col gap-8 lg:col-span-5">
          <div className="flex flex-col gap-3">
            <Link href={`/brands/${product.brand.slug}`} className="label link-underline self-start text-terracotta">
              {product.brand.name}
            </Link>
            <h1 className="font-serif text-4xl leading-[1.05] sm:text-5xl">{product.name}</h1>
          </div>

          <ProductPurchase product={product} card={card} freeDeliveryThresholdCents={settings.freeDeliveryThresholdCents} />

          {(product.description || product.weightGrams != null) && (
            <section className="border-t border-ink pt-5">
              <h2 className="label mb-3">{t.product.description}</h2>
              {product.description && (
                <div className="prose-ll text-[15px] leading-relaxed text-ink-soft">
                  {product.description.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
              {product.weightGrams != null && (
                <dl className="mt-4 flex gap-2 text-[15px]">
                  <dt className="text-muted">{t.product.weight}:</dt>
                  <dd className="tabular-nums">{formatWeight(product.weightGrams)}</dd>
                </dl>
              )}
            </section>
          )}

          <section className="flex gap-4 border border-line bg-paper p-5">
            {product.brand.logo && (
              <div className="relative size-16 shrink-0 border border-line">
                <Image src={product.brand.logo.sm} alt="" fill sizes="64px" className="object-cover" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <p className="label text-muted">{t.product.madeBy}</p>
              <p className="font-serif text-xl">{product.brand.name}</p>
              <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{product.brand.story}</p>
              <Link href={`/brands/${product.brand.slug}`} className="label link-underline self-start py-1">
                {fmt(t.product.visitBrand, { brand: product.brand.name })}
              </Link>
            </div>
          </section>
        </div>
      </div>

      {product.related.length > 0 && (
        <section className="pt-24">
          <SectionHeading title={t.product.related} />
          <ProductGrid products={product.related} />
        </section>
      )}

      <RecentlyViewed current={card} />
      <JsonLd data={productLd(product)} />
    </Container>
  );
}
