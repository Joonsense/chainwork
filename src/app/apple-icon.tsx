import { ImageResponse } from "next/og";

/* Apple touch icon — iOS masks to a rounded square, so we fill the full
   tile with the brand gradient and center the chain-link glyph with safe
   padding. Mirrors icon.tsx / the OG mark for a consistent identity. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg,#5b8def,#9d6bff)",
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              width: 64,
              height: 46,
              border: "13px solid #ffffff",
              borderRadius: 24,
            }}
          />
          <div
            style={{
              width: 64,
              height: 46,
              border: "13px solid #ffffff",
              borderRadius: 24,
              marginLeft: -24,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
