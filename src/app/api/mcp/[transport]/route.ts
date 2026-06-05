import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getJobBySlug, searchJobs } from "@/db/queries";
import {
  ECOSYSTEM_OPTIONS,
  LOCATION_OPTIONS,
  POSTED_VALUES,
  ROLE_OPTIONS,
  SALARY_MAX,
  SENIORITY_LEVELS,
  type JobFilters,
} from "@/lib/jobs-search-params";
import { SITE_URL } from "@/lib/site";

const ALLOWED_ROLES = ROLE_OPTIONS.map((r) => r.value).join(", ");
const ALLOWED_LOCATIONS = LOCATION_OPTIONS.map((l) => l.value).join(", ");
const ALLOWED_ECOS = ECOSYSTEM_OPTIONS.join(", ");
const ALLOWED_SENIORITY = SENIORITY_LEVELS.join(", ");

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_jobs",
      {
        title: "Search ChainWork jobs",
        description:
          "Search ChainWork's curated database of crypto, web3, and AI x crypto engineering jobs from 120+ companies. Returns up to 20 jobs at a time with title, company, salary range, location, and an apply URL. Use empty filters to browse the newest roles.",
        inputSchema: {
          q: z
            .string()
            .optional()
            .describe(
              "Free-text keyword across title, company, and skills (e.g. 'rust senior')",
            ),
          ecosystems: z
            .array(z.string())
            .optional()
            .describe(`Blockchain ecosystems. Allowed: ${ALLOWED_ECOS}`),
          roles: z
            .array(z.string())
            .optional()
            .describe(`Role category slug. Allowed: ${ALLOWED_ROLES}`),
          seniority: z
            .array(z.string())
            .optional()
            .describe(`Seniority level. Allowed: ${ALLOWED_SENIORITY}`),
          locations: z
            .array(z.string())
            .optional()
            .describe(`Remote scope slug. Allowed: ${ALLOWED_LOCATIONS}`),
          min_salary_k: z
            .number()
            .int()
            .min(0)
            .max(500)
            .optional()
            .describe("Minimum annual salary in $thousands USD (e.g. 150)"),
          posted_within: z
            .enum(POSTED_VALUES)
            .optional()
            .describe("Time window for posting date"),
          limit: z.number().int().min(1).max(20).optional(),
          offset: z.number().int().min(0).optional(),
        },
      },
      async (args) => {
        const filters: JobFilters = {
          q: args.q ?? "",
          eco: args.ecosystems ?? [],
          role: args.roles ?? [],
          seniority: args.seniority ?? [],
          loc: args.locations ?? [],
          min: args.min_salary_k ?? 0,
          max: SALARY_MAX,
          token: false,
          posted: args.posted_within ?? "all",
          sort: "newest",
        };
        const limit = args.limit ?? 10;
        const offset = args.offset ?? 0;
        const { jobs, total } = await searchJobs(filters, { limit, offset });

        const summary = jobs.map((j) => ({
          slug: j.slug,
          title: j.title,
          company: j.company.name,
          role_category: j.roleCategory,
          seniority: j.seniority,
          location: j.location,
          salary_usd: `$${Math.round(j.salaryMin / 1000)}k–$${Math.round(j.salaryMax / 1000)}k`,
          has_token_or_equity: j.hasTokenEquity,
          ecosystems: j.ecosystems,
          skills: j.skills,
          posted_at: j.postedAt.toISOString(),
          url: `${SITE_URL}/jobs/${j.slug}`,
          apply_url: j.applyUrl ?? `${SITE_URL}/jobs/${j.slug}`,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total_matches: total,
                  returned: jobs.length,
                  next_offset:
                    offset + jobs.length < total ? offset + jobs.length : null,
                  jobs: summary,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.registerTool(
      "get_job",
      {
        title: "Get ChainWork job by slug",
        description:
          "Fetch the full description, responsibilities, requirements, and apply URL for a single ChainWork job by its slug. Pair with search_jobs to drill down on a specific result.",
        inputSchema: {
          slug: z
            .string()
            .min(1)
            .describe("The job's slug (e.g. 'cw-eng-104' or 'ashby-foo-bar')"),
        },
      },
      async ({ slug }) => {
        const job = await getJobBySlug(slug);
        if (!job) {
          return {
            content: [
              {
                type: "text",
                text: `No job found for slug "${slug}". Use search_jobs to find a valid slug.`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  slug: job.slug,
                  title: job.title,
                  one_liner: job.oneLiner,
                  company: {
                    name: job.company.name,
                    slug: job.company.slug,
                    website: job.company.website,
                    focus: job.company.focus,
                    stage: job.company.stage,
                    size: job.company.size,
                    hq: job.company.hq,
                  },
                  role_category: job.roleCategory,
                  seniority: job.seniority,
                  employment_type: job.employmentType,
                  location: job.location,
                  remote_scope: job.remoteScope,
                  salary_usd: `$${Math.round(job.salaryMin / 1000)}k–$${Math.round(job.salaryMax / 1000)}k`,
                  has_token_or_equity: job.hasTokenEquity,
                  ecosystems: job.ecosystems,
                  skills: job.skills,
                  description_md: job.descriptionMd,
                  responsibilities: job.responsibilities,
                  requirements: job.requirements,
                  nice_to_have: job.niceToHave,
                  posted_at: job.postedAt.toISOString(),
                  url: `${SITE_URL}/jobs/${job.slug}`,
                  apply_url: job.applyUrl ?? `${SITE_URL}/jobs/${job.slug}`,
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );
  },
  {
    serverInfo: {
      name: "chainwork",
      version: "1.0.0",
    },
    instructions:
      "ChainWork is a curated job board for crypto, web3, and AI x crypto engineering roles. Use search_jobs to browse or filter, then get_job for the full posting. Salaries are USD-annual and shown as min–max ranges. Every job has a public apply URL.",
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: false,
  },
);

export { handler as GET, handler as POST };
