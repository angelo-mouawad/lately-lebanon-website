import type { Metadata } from "next";
import Image from "next/image";
import type { StoreSettings } from "@latelylebanon/shared";
import { apiGet } from "@/lib/api";
import { pagesEn } from "@/i18n/pages.en";
import { InfoPage } from "@/components/store/InfoPage";

const page = pagesEn.about;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: "/about" },
};

export default async function Page() {
  const settings = await apiGet<StoreSettings>("/settings", { tags: ["settings"] });
  // The About photo is set in Admin > Homepage and shop. Until then, use the home page photo.
  const photo = settings.aboutImage ?? settings.heroImage;

  return (
    <InfoPage
      page={page}
      aside={
        <div className="relative aspect-4/5 w-full max-w-md overflow-hidden border border-ink bg-sand-deep lg:max-w-none">
          {photo && (
            <Image
              src={photo.lg}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 448px) 448px, 100vw"
              className="object-cover"
            />
          )}
        </div>
      }
    />
  );
}
