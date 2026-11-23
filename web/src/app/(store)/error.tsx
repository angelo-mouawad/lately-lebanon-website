"use client";

import { getMessages } from "@/i18n";
import { Button } from "@/components/ui/Button";

const t = getMessages();

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-[1440px] flex-col justify-center gap-6 px-4 py-20 sm:px-6 lg:px-10">
      <h1 className="font-serif text-5xl">{t.errors.generic}</h1>
      <div>
        <Button onClick={reset}>{t.common.retry}</Button>
      </div>
    </div>
  );
}
