/**
 * Locales the storefront can serve. Only English is live at launch; Arabic (RTL) and
 * French are added by creating ar.ts and fr.ts next to en.ts and listing them here.
 */
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const rtl = new Set<string>(["ar"]);

export function dirFor(locale: string): "ltr" | "rtl" {
  return rtl.has(locale) ? "rtl" : "ltr";
}
