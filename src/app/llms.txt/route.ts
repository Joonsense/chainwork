import { getAllJobs, getHomeStats } from "@/db/queries";
import { formatSalary, relativeTime } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

/* Read fresh from Neon; the CDN holds it for 10 min via Cache-Control. */
export const dynamic = "force-dynamic";

/**
 * `/llms.txt` — a plain-text, agent-readable index of every live role.
 * The differentiator: an agent gets the catalog without parsing HTML.
 */
export async function GET() {
  const [allJobs, stats] = await Promise.all([getAllJobs(), getHomeStats()]);

  const indexed = stats.lastIndexedAt
    ? `${relativeTime(stats.lastIndexedAt)} ago`
    : "just now";

  const roleLines = allJobs.map((job) => {
    const salary = formatSalary(job.salaryMin, job.salaryMax);
    return `- /llms/${job.slug}.md — ${job.title} at ${job.company.name} (${salary}, ${job.location})`;
  });

  const body = [
    "# chainwork",
    "",
    "> The registry for AI × crypto engineering roles. Salary-transparent, agent-native, indexed daily from real ATS feeds.",
    "",
    `${stats.jobs} live roles at ${stats.companies} companies. Indexed ${indexed}.`,
    "",
    "## Roles",
    "",
    "Every role has a machine-readable markdown file at the path below — fetch it directly, no HTML parsing needed.",
    "",
    ...roleLines,
    "",
    "## API",
    "",
    `- GET ${SITE_URL}/api/jobs — paginated job feed as JSON, company embedded, schema.org JSON-LD on every row. Params: ?limit=50&offset=0&eco=&role=&min=`,
    `- GET ${SITE_URL}/api/jobs/{slug} — a single job as JSON, JSON-LD intact.`,
    `- GET ${SITE_URL}/llms/{slug}.md — a single role as markdown.`,
    `- GET ${SITE_URL}/sitemap.xml — every indexable URL.`,
    "",
    "## MCP",
    "",
    `An MCP (Model Context Protocol) server is available at ${SITE_URL}/api/mcp/mcp — Streamable HTTP transport, no auth. Two tools: \`search_jobs\` (filterable, paginated) and \`get_job\` (by slug). Setup instructions at ${SITE_URL}/mcp.`,
    "",
    "## Conventions",
    "",
    "- Salaries are annual, in USD, and always shown as a transparent min-max range.",
    "- Most roles are remote; the location field carries either a timezone scope (Worldwide, Americas, Europe, EMEA, APAC) for remote roles or a city for on-site roles.",
    "- The JSON API allows cross-origin requests from any origin (CORS *).",
    "- The JSON API is rate-limited to 600 requests per minute per IP.",
    "- Job slugs are stable, URL-safe, and safe to cite.",
    "- Each job carries schema.org/JobPosting JSON-LD, ready for ingestion.",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "s-maxage=600, stale-while-revalidate",
    },
  });
}
