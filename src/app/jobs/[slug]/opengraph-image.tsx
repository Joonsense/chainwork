import { ImageResponse } from "next/og";
import { getJobBySlug } from "@/db/queries";
import { formatSalary } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Chainwork job posting";

/** Dynamic OG image — dark base + brand-gradient wash, job title + salary. */
export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  const title = job?.title ?? "Role not found";
  const company = job?.company.name ?? "chainwork";
  const salary = job ? formatSalary(job.salaryMin, job.salaryMax) : "";
  const location = job?.location ?? "";

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
              width: 36,
              height: 36,
              borderRadius: 9,
              backgroundImage: "linear-gradient(135deg,#5b8def,#9d6bff)",
            }}
          />
          <div
            style={{
              marginLeft: 14,
              fontSize: 28,
              fontWeight: 700,
              color: "#f5f5f7",
            }}
          >
            chainwork
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 19,
              color: "rgba(245,245,247,0.45)",
            }}
          >
            schema.org · JobPosting
          </div>
        </div>

        {/* title block */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#9d8bff" }}>
            {company}
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              fontSize: 70,
              fontWeight: 700,
              color: "#f5f5f7",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </div>
        </div>

        {/* salary + location */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {salary && (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                color: "#ffffff",
                backgroundImage: "linear-gradient(135deg,#5b8def,#9d6bff)",
                padding: "12px 26px",
                borderRadius: 13,
              }}
            >
              {salary}
            </div>
          )}
          <div
            style={{
              marginLeft: salary ? 20 : 0,
              fontSize: 26,
              color: "rgba(245,245,247,0.7)",
            }}
          >
            {location}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
