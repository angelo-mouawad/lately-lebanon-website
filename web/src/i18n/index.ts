import { defaultLocale, type Locale } from "./config";
import { en, type Messages } from "./en";

const dictionaries: Record<Locale, Messages> = { en };

/** Returns the message dictionary for a locale. Works in server and client components. */
export function getMessages(locale: Locale = defaultLocale): Messages {
  return dictionaries[locale];
}

/** Fills {placeholders} in a message: fmt("{count} items", { count: 3 }). */
export function fmt(message: string, vars: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

/** Picks the singular or plural form: plural(n, "item", "items"). */
export function plural(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}

export type { Messages };
