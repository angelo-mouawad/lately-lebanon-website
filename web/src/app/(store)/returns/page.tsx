import type { Metadata } from "next";
import { pagesEn } from "@/i18n/pages.en";
import { InfoPage } from "@/components/store/InfoPage";

const page = pagesEn.returns;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: "/returns" },
};

export default function Page() {
  return <InfoPage page={page} />;
}
