import { ImageResponse } from "next/og";
import { getMessages } from "@/i18n";

const t = getMessages();

export const alt = `${t.meta.title}: ${t.meta.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The default sharing image: the wordmark beside a row of souk arches. */
export default function OpenGraphImage() {
  const arches = ["#5b6339", "#a8492a", "#5b6339", "#a8492a"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f4efe6", color: "#1b1815" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, width: 600 }}>
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#a8492a" }}>{t.home.kicker}</div>
          <div style={{ fontSize: 92, lineHeight: 1, marginTop: 20, fontWeight: 600 }}>{t.meta.title}</div>
          <div style={{ fontSize: 30, marginTop: 24, color: "#3d3832" }}>{t.meta.tagline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, padding: "0 56px 0 0", borderLeft: "2px solid #1b1815" }}>
          {arches.map((colour, i) => (
            <div key={i} style={{ width: 120, height: 380, background: colour, borderTopLeftRadius: 60, borderTopRightRadius: 60 }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
