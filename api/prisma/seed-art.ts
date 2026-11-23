/**
 * Placeholder artwork for the seed data: simple flat compositions in the brand's earthy
 * palette, drawn as SVG and rendered to images with sharp. No text, so they render the
 * same on any machine, with or without fonts installed.
 */

export const palette = {
  sand: "#E9DFCE",
  cream: "#F4EFE6",
  clay: "#C9876A",
  terracotta: "#A8492A",
  olive: "#5B6339",
  sage: "#9AA07A",
  ochre: "#C69C4E",
  sea: "#5E7C83",
  rose: "#C98F86",
  ink: "#1B1815",
  charcoal: "#3A3632",
} as const;

export type Colour = keyof typeof palette;
export type Motif = "soap" | "cup" | "bowl" | "jug" | "textile" | "jar" | "box";

const W = 1200;
const H = 1500;

function wrap(body: string, bg: string, width = W, height = H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${bg}"/>${body}</svg>`;
}

const shadow = (cx: number, cy: number, rx: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="0.08"/>`;

function motif(kind: Motif, main: string, detail: string): string {
  switch (kind) {
    case "soap":
      return `${shadow(600, 1060, 330)}
<rect x="300" y="820" width="600" height="230" rx="36" fill="${main}"/>
<rect x="340" y="610" width="520" height="210" rx="34" fill="${detail}"/>
<rect x="380" y="420" width="440" height="190" rx="32" fill="${main}" opacity="0.85"/>
<rect x="470" y="490" width="260" height="50" rx="25" fill="none" stroke="${detail}" stroke-width="6"/>`;
    case "cup":
      return `${shadow(600, 1040, 300)}
<path d="M390 640 h420 l-40 360 a40 40 0 0 1 -40 36 h-260 a40 40 0 0 1 -40 -36 z" fill="${main}"/>
<rect x="380" y="620" width="440" height="34" rx="17" fill="${detail}"/>
<path d="M330 1036 h540" stroke="${detail}" stroke-width="10" stroke-linecap="round"/>`;
    case "bowl":
      return `${shadow(600, 1020, 400)}
<path d="M220 700 h760 a380 330 0 0 1 -760 0 z" fill="${main}"/>
<ellipse cx="600" cy="700" rx="380" ry="54" fill="${detail}"/>
<rect x="500" y="1000" width="200" height="34" rx="10" fill="${main}"/>`;
    case "jug":
      return `${shadow(600, 1120, 300)}
<path d="M480 420 h240 l-20 120 c180 60 220 240 180 420 c-20 90 -80 150 -160 150 h-240 c-80 0 -140 -60 -160 -150 c-40 -180 0 -360 180 -420 z" fill="${main}"/>
<path d="M800 600 c120 20 140 200 20 260" fill="none" stroke="${main}" stroke-width="40" stroke-linecap="round"/>
<path d="M400 820 h400" stroke="${detail}" stroke-width="14"/>`;
    case "textile":
      return `${shadow(600, 1150, 380)}
<rect x="260" y="380" width="680" height="760" fill="${main}"/>
${[0, 1, 2, 3, 4, 5]
  .map((i) => `<rect x="260" y="${440 + i * 120}" width="680" height="${i % 2 ? 18 : 40}" fill="${detail}"/>`)
  .join("")}
<path d="M260 1140 v60 M300 1140 v60 M340 1140 v60 M380 1140 v60 M820 1140 v60 M860 1140 v60 M900 1140 v60 M940 1140 v60" stroke="${main}" stroke-width="8"/>`;
    case "jar":
      return `${shadow(600, 1120, 280)}
<rect x="410" y="420" width="380" height="90" rx="12" fill="${detail}"/>
<path d="M380 530 h440 a40 40 0 0 1 40 40 v500 a40 40 0 0 1 -40 40 h-440 a40 40 0 0 1 -40 -40 v-500 a40 40 0 0 1 40 -40 z" fill="${main}"/>
<rect x="400" y="700" width="400" height="200" fill="${palette.cream}" opacity="0.9"/>
<path d="M440 760 h320 M440 820 h220" stroke="${detail}" stroke-width="12"/>`;
    case "box":
      return `${shadow(600, 1110, 380)}
<rect x="250" y="560" width="700" height="540" fill="${main}"/>
<rect x="220" y="480" width="760" height="120" fill="${main}" opacity="0.85"/>
<rect x="560" y="480" width="80" height="620" fill="${detail}"/>
<path d="M600 480 c-120 -140 -260 -40 -150 0 z M600 480 c120 -140 260 -40 150 0 z" fill="${detail}"/>`;
  }
}

/** Main product shot: the object on a flat ground with a horizon line. */
export function productArt(kind: Motif, bg: Colour, main: Colour, detail: Colour): string {
  return wrap(
    `<rect y="${H * 0.7}" width="${W}" height="${H * 0.3}" fill="#000" opacity="0.04"/>${motif(kind, palette[main], palette[detail])}`,
    palette[bg],
  );
}

/** Second shot: a close crop of the colour and texture. */
export function detailArt(bg: Colour, main: Colour, detail: Colour, seed: number): string {
  const lines = Array.from({ length: 14 }, (_, i) => {
    const y = 120 + i * 95 + ((seed * 37 + i * 13) % 30);
    return `<path d="M0 ${y} C 300 ${y - 40}, 900 ${y + 40}, ${W} ${y}" stroke="${palette[detail]}" stroke-width="${3 + ((seed + i) % 4)}" fill="none" opacity="0.5"/>`;
  }).join("");
  return wrap(
    `<circle cx="${400 + (seed % 5) * 90}" cy="${600 + (seed % 3) * 120}" r="620" fill="${palette[main]}"/>${lines}`,
    palette[bg],
  );
}

/** Square brand mark: a circle and an arch, a nod to old souk doorways. */
export function logoArt(bg: Colour, fg: Colour): string {
  return wrap(
    `<circle cx="300" cy="300" r="250" fill="${palette[fg]}"/><path d="M200 470 v-170 a100 100 0 0 1 200 0 v170 z" fill="${palette[bg]}"/>`,
    palette[bg],
    600,
    600,
  );
}

/** Wide cover: arches in a row, like a souk arcade. */
export function coverArt(bg: Colour, a: Colour, b: Colour): string {
  const arches = Array.from({ length: 5 }, (_, i) => {
    const x = 60 + i * 300;
    return `<path d="M${x} 900 v-420 a130 130 0 0 1 260 0 v420 z" fill="${palette[i % 2 ? a : b]}"/>`;
  }).join("");
  return wrap(`${arches}<rect y="820" width="1600" height="80" fill="${palette.ink}" opacity="0.12"/>`, palette[bg], 1600, 900);
}
