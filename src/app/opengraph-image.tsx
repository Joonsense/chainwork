import { ImageResponse } from "next/og";
import { getHomeStats } from "@/db/queries";

/* Re-render per request so the live count never goes stale. */
export const dynamic = "force-dynamic";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Chainwork · the registry for AI × crypto roles";

/** Root OG image — dark base, dot-grid texture, brand-gradient glow,
    wordmark, headline, and a live job count. Tuned to read cleanly as a
    social card thumbnail. */
export default async function OgImage() {
  const stats = await getHomeStats();
  const count = `${stats.jobs.toLocaleString()} live roles · ${stats.companies.toLocaleString()} companies`;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: "#08080b",
          backgroundImage:
            "linear-gradient(135deg, rgba(124,90,255,0.30) 0%, rgba(8,8,11,0) 46%), linear-gradient(300deg, rgba(60,160,255,0.16) 0%, rgba(8,8,11,0) 40%)",
        }}
      >
        {/* dot-grid texture overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1.2px, transparent 0)",
            backgroundSize: "38px 38px",
          }}
        />

        {/* top hairline accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 6,
            display: "flex",
            backgroundImage: "linear-gradient(90deg,#5b8def,#9d6bff,#3ca0ff)",
          }}
        />

        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundImage: "linear-gradient(135deg,#5b8def,#9d6bff)",
              boxShadow: "0 8px 30px rgba(124,90,255,0.45)",
            }}
          >
            <div style={{ display: "flex" }}>
              <div
                style={{
                  width: 23,
                  height: 17,
                  border: "5px solid #ffffff",
                  borderRadius: 8,
                }}
              />
              <div
                style={{
                  width: 23,
                  height: 17,
                  border: "5px solid #ffffff",
                  borderRadius: 8,
                  marginLeft: -9,
                }}
              />
            </div>
          </div>
          <div
            style={{
              marginLeft: 22,
              fontSize: 38,
              fontWeight: 700,
              color: "#f5f5f7",
              letterSpacing: "-0.02em",
            }}
          >
            Chainwork
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            maxWidth: 940,
            fontSize: 78,
            fontWeight: 800,
            color: "#f5f5f7",
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
          }}
        >
          The registry for AI × crypto roles.
        </div>

        {/* live count + tagline */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
              backgroundImage: "linear-gradient(135deg,#5b8def,#9d6bff)",
              padding: "14px 28px",
              borderRadius: 14,
              boxShadow: "0 8px 26px rgba(124,90,255,0.4)",
            }}
          >
            {count}
          </div>
          <div
            style={{
              marginLeft: 22,
              fontSize: 22,
              color: "rgba(245,245,247,0.5)",
            }}
          >
            salary-transparent · agent-native · indexed daily
          </div>
        </div>
      </div>
    ),
    size,
  );
}
