import { ImageResponse } from "next/og";
import { getHomeStats } from "@/db/queries";

/* Re-render per request so the live count never goes stale. */
export const dynamic = "force-dynamic";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "chainwork — the hiring layer for crypto, AI & the open web";

/** Root OG image — dark base + brand-gradient wash, wordmark + live count. */
export default async function OgImage() {
  const stats = await getHomeStats();
  const count = `${stats.jobs.toLocaleString()} live roles at ${stats.companies.toLocaleString()} companies`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: "#08080b",
          backgroundImage:
            "linear-gradient(135deg, rgba(124,90,255,0.34) 0%, rgba(8,8,11,0) 48%), linear-gradient(300deg, rgba(60,160,255,0.18) 0%, rgba(8,8,11,0) 42%)",
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundImage: "linear-gradient(135deg,#5b8def,#9d6bff)",
            }}
          />
          <div
            style={{
              marginLeft: 16,
              fontSize: 30,
              fontWeight: 700,
              color: "#f5f5f7",
            }}
          >
            chainwork
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            maxWidth: 920,
            fontSize: 76,
            fontWeight: 700,
            color: "#f5f5f7",
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
          }}
        >
          The hiring layer for crypto, AI & the open web.
        </div>

        {/* live count */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
              backgroundImage: "linear-gradient(135deg,#5b8def,#9d6bff)",
              padding: "12px 26px",
              borderRadius: 13,
            }}
          >
            {count}
          </div>
          <div
            style={{
              marginLeft: 20,
              fontSize: 22,
              color: "rgba(245,245,247,0.5)",
            }}
          >
            structured for humans and agents
          </div>
        </div>
      </div>
    ),
    size,
  );
}
