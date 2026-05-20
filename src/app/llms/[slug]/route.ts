import { type NextRequest } from "next/server";
import { getJobBySlug } from "@/db/queries";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Salary in $thousands, e.g. 150000 → "150". */
const k = (n: number) => Math.round(n / 1000);

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

/**
 * Per-role markdown for agents — served at `/llms/{slug}.md`.
 *
 * Next's App Router only treats a folder as dynamic when it is *exactly*
 * `[name]` (see `getSegmentParam`), so the `.md` suffix cannot live on the
 * folder. The folder is `[slug]`; the `.md` rides along in the param and is
 * stripped here. The public URL — `/llms/{slug}.md` — is unchanged.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await params;
  const slug = raw.replace(/\.md$/, "");
  const job = await getJobBySlug(slug);

  if (!job) {
    return new Response(`# Not found\n\nNo role exists at /llms/${raw}\n`, {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  const { company } = job;
  const verified = company.verified ? " (✓ verified)" : "";
  const token = job.hasTokenEquity ? " (+ token)" : "";
  const salary = `$${k(job.salaryMin)}-${k(job.salaryMax)}k ${job.salaryCurrency}`;
  const apply =
    job.applyUrl ?? (job.applyEmail ? `mailto:${job.applyEmail}` : "—");

  const sections = [
    `# ${job.title}`,
    "",
    `**Company**: ${company.name}${verified}`,
    `**Salary**: ${salary}${token}`,
    `**Location**: ${job.location}`,
    `**Type**: ${job.employmentType}`,
    `**Posted**: ${job.postedAt.toISOString()}`,
    `**Apply**: ${apply}`,
    "",
    "## About",
    "",
    job.descriptionMd,
    "",
    "## Responsibilities",
    "",
    bullets(job.responsibilities),
    "",
    "## Requirements",
    "",
    bullets(job.requirements),
  ];

  if (job.niceToHave.length > 0) {
    sections.push("", "## Nice to have", "", bullets(job.niceToHave));
  }

  sections.push("", "---", `JSON-LD: ${SITE_URL}/api/jobs/${job.slug}`, "");

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "s-maxage=600, stale-while-revalidate",
    },
  });
}
