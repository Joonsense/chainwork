import { ImageResponse } from "next/og";

/* App favicon — brand-gradient tile + chain-link glyph, matching BrandLogo
   and the OG image. SVG-rendered so it stays crisp at 16px. */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

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
          borderRadius: 14,
          backgroundImage: "linear-gradient(135deg,#5b8def,#9d6bff)",
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              width: 24,
              height: 17,
              border: "5px solid #ffffff",
              borderRadius: 9,
            }}
          />
          <div
            style={{
              width: 24,
              height: 17,
              border: "5px solid #ffffff",
              borderRadius: 9,
              marginLeft: -9,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
