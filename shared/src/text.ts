/**
 * Shortens text for search results and link previews without cutting a word in half.
 * Collapses whitespace, cuts at the last full word that fits and adds an ellipsis.
 */
export function excerpt(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const words = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${words.replace(/[\s,;:.\-–—]+$/, "")}…`;
}

/** 250 becomes "250 g", 1200 becomes "1.2 kg". */
export function formatWeight(grams: number): string {
  if (grams < 1000) return `${grams} g`;
  const kg = grams / 1000;
  return `${Number.isInteger(kg) ? kg : kg.toFixed(kg < 10 ? 2 : 1).replace(/0$/, "")} kg`;
}
