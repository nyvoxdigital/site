import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// A camera glyph built from plain shapes (ImageResponse renders a restricted CSS subset,
// no SVG paths) — body, viewfinder bump, and a lens ring in the site's own accent red so
// the favicon reads as "this site" at a glance, not a generic stock icon.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          borderRadius: 14
        }}
      >
        <div style={{ position: "relative", width: 44, height: 34, display: "flex" }}>
          <div
            style={{
              position: "absolute",
              top: -7,
              left: 8,
              width: 14,
              height: 8,
              background: "#f7f2e8",
              borderRadius: "3px 3px 0 0"
            }}
          />
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#f7f2e8",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#e0423b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#050505", display: "flex" }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
