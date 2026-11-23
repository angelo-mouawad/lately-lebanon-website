import { getMessages } from "@/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";

const t = getMessages();

export function WhatsAppButton({ number }: { number: string }) {
  return (
    <a
      href={whatsappLink(number, t.whatsapp.greeting)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsapp.button}
      className="no-print fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center border border-ink bg-olive text-paper transition-colors hover:bg-ink sm:right-6 sm:bottom-6 rtl:right-auto rtl:left-4"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
