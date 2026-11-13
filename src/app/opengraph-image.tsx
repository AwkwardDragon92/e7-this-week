import { ImageResponse } from "next/og";

export const alt = "E7 This Week: Epic Seven codes, banners and rerun tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #09090b 0%, #2e1065 60%, #4c1d95 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, color: "#c4b5fd", fontWeight: 700 }}>Epic Seven fan tracker</div>
        <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -3, marginTop: 10 }}>E7 This Week</div>
        <div style={{ fontSize: 40, color: "#e4e4e7", marginTop: 20 }}>Working codes · Banners · Rerun Watch · Events</div>
        <div style={{ fontSize: 28, color: "#a1a1aa", marginTop: 50 }}>epic7.awkwarddragon.com · Not affiliated with Smilegate</div>
      </div>
    ),
    size,
  );
}
