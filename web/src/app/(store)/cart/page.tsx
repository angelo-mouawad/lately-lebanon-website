import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { CartView } from "@/components/store/CartView";
import { Container } from "@/components/store/sections";

const t = getMessages();

export const metadata: Metadata = { title: t.cart.title, robots: { index: false } };

export default function CartPage() {
  return (
    <Container className="pt-10 lg:pt-14">
      <h1 className="mb-10 font-serif text-5xl leading-none">{t.cart.title}</h1>
      <CartView />
    </Container>
  );
}
