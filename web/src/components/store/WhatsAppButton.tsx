import { formatLebanesePhone } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";

const t = getMessages();

const buttonClass =
  "flex size-14 cursor-pointer list-none items-center justify-center border border-ink bg-olive text-paper transition-colors hover:bg-ink [&::-webkit-details-marker]:hidden";

/**
 * The floating WhatsApp button. With one number it opens the chat straight away.
 * With two, it opens a small menu to pick one (a <details> element, so no JavaScript is needed).
 */
export function WhatsAppButton({ numbers }: { numbers: string[] }) {
  const position = "no-print fixed right-4 bottom-4 z-30 sm:right-6 sm:bottom-6 rtl:right-auto rtl:left-4";

  if (numbers.length < 2) {
    return (
      <a
        href={whatsappLink(numbers[0] ?? "", t.whatsapp.greeting)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.whatsapp.button}
        className={`${position} ${buttonClass}`}
      >
        <WhatsAppIcon className="size-7" />
      </a>
    );
  }

  return (
    <details className={`${position} group`}>
      <summary aria-label={t.whatsapp.button} className={buttonClass}>
        <WhatsAppIcon className="size-7" />
      </summary>
      <div className="absolute right-0 bottom-16 w-60 border border-ink bg-paper rtl:right-auto rtl:left-0">
        <p className="label border-b border-line px-4 py-3 text-muted">{t.whatsapp.chooseNumber}</p>
        <ul>
          {numbers.map((n) => (
            <li key={n} className="border-b border-line last:border-b-0">
              <a
                href={whatsappLink(n, t.whatsapp.greeting)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-[15px] tabular-nums hover:bg-sand"
              >
                <WhatsAppIcon className="size-5 text-olive" />
                {formatLebanesePhone(n)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
