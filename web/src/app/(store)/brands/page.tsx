import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { PublicBrandCard } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { apiGet } from "@/lib/api";
import { Container } from "@/components/store/sections";

const t = getMessages();

export const metadata: Metadata = {
  title: t.brands.title,
  description: t.brands.intro,
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const brands = await apiGet<PublicBrandCard[]>("/brands");

  return (
    <Container className="pt-10 lg:pt-14">
      <header className="mb-12 grid gap-6 border-b border-ink pb-10 lg:grid-cols-12">
        <h1 className="font-serif text-5xl leading-none sm:text-7xl lg:col-span-6">{t.brands.title}</h1>
        <p className="self-end text-[17px] leading-relaxed text-ink-soft lg:col-span-5 lg:col-start-8">{t.brands.intro}</p>
      </header>
      <ul className="flex flex-col">
        {brands.map((b, i) => (
          <li key={b.id} className="border-b border-line">
            <Link href={`/brands/${b.slug}`} className="group grid gap-6 py-8 md:grid-cols-12 md:items-center md:gap-10">
              <div className={`relative aspect-[16/10] overflow-hidden bg-sand-deep md:col-span-6 ${i % 2 ? "md:order-2" : ""}`}>
                {b.cover && (
                  <Image
                    src={b.cover.lg}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                )}
              </div>
              <div className="flex flex-col gap-4 md:col-span-5">
                <div className="flex items-center gap-4">
                  {b.logo && (
                    <div className="relative size-12 shrink-0 border border-line">
                      <Image src={b.logo.sm} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                  )}
                  <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                    <span className="link-underline">{b.name}</span>
                  </h2>
                </div>
                <p className="line-clamp-4 text-[15px] leading-relaxed text-ink-soft">{b.story}</p>
                <p className="label text-muted">
                  {b.productCount === 1 ? t.brands.productsOne : fmt(t.brands.products, { count: b.productCount })}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
