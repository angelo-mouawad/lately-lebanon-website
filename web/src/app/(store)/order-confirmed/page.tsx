import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import { Confirmation } from "@/components/store/Confirmation";
import { Container } from "@/components/store/sections";

const t = getMessages();

export const metadata: Metadata = { title: t.confirmation.title, robots: { index: false } };

export default function OrderConfirmedPage() {
  return (
    <Container className="pt-10 lg:pt-14">
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-2xl" />}>
        <Confirmation />
      </Suspense>
    </Container>
  );
}
