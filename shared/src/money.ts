/** All money is stored and moved around as integer cents (USD). */

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formats cents as "$12.50", or "$12" when the amount is a whole dollar. */
export function formatUSD(cents: number): string {
  return cents % 100 === 0 ? usdWhole.format(cents / 100) : usd.format(cents / 100);
}

/** Commission on a line, rounded to the nearest cent. `pct` is a percentage such as 20 or 17.5. */
export function percentOf(cents: number, pct: number): number {
  return Math.round((cents * Math.round(pct * 100)) / 10000);
}
