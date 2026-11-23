import type { ReactNode } from "react";
import type { InfoPage as InfoPageContent } from "@/i18n/pages.en";
import { Container } from "./sections";

/** Layout for text pages: a large title on the left, readable sections on the right. */
export function InfoPage({ page, aside, children }: { page: InfoPageContent; aside?: ReactNode; children?: ReactNode }) {
  return (
    <Container className="pt-10 lg:pt-14">
      <div className="grid gap-10 lg:grid-cols-12">
        <header className="flex flex-col gap-6 lg:col-span-4">
          <h1 className="font-serif text-5xl leading-none sm:text-6xl">{page.title}</h1>
          {aside}
        </header>
        <div className="flex max-w-2xl flex-col lg:col-span-7 lg:col-start-6">
          {page.intro && <p className="mb-10 font-serif text-2xl leading-snug">{page.intro}</p>}
          {page.sections.map((s, i) => (
            <section key={i} className="border-t border-line py-7">
              {s.heading && <h2 className="mb-3 text-lg font-medium">{s.heading}</h2>}
              <div className="prose-ll text-[15px] leading-relaxed text-ink-soft">
                {s.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </section>
          ))}
          {children}
        </div>
      </div>
    </Container>
  );
}
