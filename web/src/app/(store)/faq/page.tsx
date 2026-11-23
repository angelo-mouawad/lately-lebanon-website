import type { Metadata } from "next";
import { pagesEn } from "@/i18n/pages.en";
import { InfoPage } from "@/components/store/InfoPage";

const page = pagesEn.faq;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: "/faq" },
};

export default function Page() {
  return <InfoPage page={page} />;
}
