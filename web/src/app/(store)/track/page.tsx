import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/i18n";
import { Container } from "@/components/store/sections";
import { TrackForm } from "@/components/store/TrackForm";

const t = getMessages();

export const metadata: Metadata = {
  title: t.track.title,
  description: t.track.intro,
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <Container className="pt-10 lg:pt-14">
      <div className="grid gap-12 lg:grid-cols-12">
        <header className="flex flex-col gap-4 lg:col-span-4">
          <h1 className="font-serif text-5xl leading-none sm:text-6xl">{t.track.title}</h1>
          <p className="text-[15px] text-ink-soft">{t.track.intro}</p>
        </header>
        <div className="lg:col-span-7 lg:col-start-6">
          <Suspense>
            <TrackForm />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
