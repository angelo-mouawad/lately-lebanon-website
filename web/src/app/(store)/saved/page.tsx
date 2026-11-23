import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { Container } from "@/components/store/sections";
import { SavedList } from "@/components/store/SavedList";

const t = getMessages();

export const metadata: Metadata = { title: t.wishlist.title, robots: { index: false } };

export default function SavedPage() {
  return (
    <Container className="pt-10 lg:pt-14">
      <h1 className="mb-10 font-serif text-5xl leading-none">{t.wishlist.title}</h1>
      <SavedList />
    </Container>
  );
}
