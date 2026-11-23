import { whatsappDigits } from "@latelylebanon/shared";

/** A wa.me link that opens a chat with a number, with an optional prefilled message. */
export function whatsappLink(e164: string, text?: string): string {
  const base = `https://wa.me/${whatsappDigits(e164)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** A WhatsApp share link with no recipient, so the customer picks who to send it to. */
export function whatsappShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
