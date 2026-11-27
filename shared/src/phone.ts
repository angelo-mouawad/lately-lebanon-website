/**
 * Lebanese phone numbers.
 * Accepts local ("03 123 456", "70 123 456", "01 234 567") and international
 * ("+961 3 123 456", "00961 70 123 456", "961 71 123456") formats.
 * Normalised output is E.164, for example "+9613123456" or "+96170123456".
 */

const MOBILE_8 = /^(70|71|76|78|79|81)\d{6}$/;
const SEVEN_DIGIT = /^[13456789]\d{6}$/;

export function normalizeLebanesePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;

  if (digits.startsWith("+961")) digits = digits.slice(4);
  else if (digits.startsWith("00961")) digits = digits.slice(5);
  else if (digits.startsWith("961") && digits.length > 9) digits = digits.slice(3);
  else if (digits.startsWith("+")) return null;

  if (digits.startsWith("0")) digits = digits.slice(1);

  if (MOBILE_8.test(digits) || SEVEN_DIGIT.test(digits)) return `+961${digits}`;
  return null;
}

export function isLebanesePhone(input: string): boolean {
  return normalizeLebanesePhone(input) !== null;
}

/** "+96170123456" becomes "70 123 456", "+9613123456" becomes "03 123 456". */
export function formatLebanesePhone(e164: string): string {
  const national = e164.replace(/^\+961/, "");
  if (national.length === 7) {
    const local = `0${national}`;
    return `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  return `${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
}

/** Digits only, for wa.me links. */
export function whatsappDigits(e164: string): string {
  return e164.replace(/\D/g, "");
}

/**
 * The shop's WhatsApp numbers in display order, skipping empty and repeated ones.
 * An empty list means WhatsApp is switched off and every WhatsApp button and mention is hidden.
 */
export function whatsappNumbers(settings: { whatsappNumber?: string | null; whatsappNumber2?: string | null }): string[] {
  const numbers: string[] = [];
  for (const n of [settings.whatsappNumber, settings.whatsappNumber2]) {
    if (n && !numbers.includes(n)) numbers.push(n);
  }
  return numbers;
}
