import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { db, jobSubmissions } from "@/db";
import { getJobBySlug, getMarketStats, searchJobs } from "@/db/queries";
import {
  ECOSYSTEM_OPTIONS,
  LOCATION_OPTIONS,
  POSTED_VALUES,
  ROLE_OPTIONS,
  SALARY_MAX,
  SENIORITY_LEVELS,
  type JobFilters,
} from "@/lib/jobs-search-params";
import { ECOSYSTEMS } from "@/lib/ecosystems";
import { EMPLOYMENT_TYPES } from "@/lib/post-schema";
import { submissionSchema } from "@/lib/submission-schema";
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
          "Search ChainWork's curated database of crypto, web3, and AI x crypto engineering jobs, ingested daily from real ATS feeds. Returns up to 20 jobs at a time with title, company, salary range, location, and an apply URL. Use empty filters to browse the newest roles.",
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
          limit: z
            .number()
            .int()
            .min(1)
            .max(20)
            .optional()
            .describe(
              "Results per page (default 10, max 20). Page through larger result sets with offset + the returned next_offset.",
            ),
          offset: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Row offset for pagination (default 0)."),
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

    server.registerTool(
      "list_filters",
      {
        title: "List ChainWork filter options",
        description:
          "Return the exact, allowed filter values for search_jobs and submit_job — ecosystems, role categories, seniority levels, and remote-location slugs. Call this first so you pass valid filters instead of guessing.",
        inputSchema: {},
      },
      async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ecosystems: ECOSYSTEM_OPTIONS.map((e) => ({
                  value: e,
                  label: ECOSYSTEMS[e]?.label ?? e.toUpperCase(),
                })),
                roles: ROLE_OPTIONS.map((r) => ({
                  value: r.value,
                  label: r.label,
                })),
                seniority: SENIORITY_LEVELS,
                locations: LOCATION_OPTIONS.map((l) => ({
                  value: l.value,
                  label: l.label,
                })),
                posted_within: POSTED_VALUES,
                employment_types: EMPLOYMENT_TYPES,
              },
              null,
              2,
            ),
          },
        ],
      }),
    );

    server.registerTool(
      "get_market_stats",
      {
        title: "ChainWork crypto-engineering market stats",
        description:
          "Get an aggregate, citable snapshot of the live AI x crypto engineering job market: salary percentiles (USD-annual midpoints), share of roles offering token/equity, remote-worldwide share, and the busiest ecosystems and role categories. Use this to answer 'what does a Solana engineer earn' or 'how many AI x crypto roles are open' style questions.",
        inputSchema: {},
      },
      async () => {
        const s = await getMarketStats();
        const k = (n: number) => `$${Math.round(n / 1000)}k`;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total_live_jobs: s.totalJobs,
                  total_companies: s.totalCompanies,
                  disclosed_salary_jobs: s.disclosedSalaryCount,
                  salary_usd_annual: s.salaryUsd
                    ? {
                        p10: k(s.salaryUsd.p10),
                        p25: k(s.salaryUsd.p25),
                        median: k(s.salaryUsd.median),
                        p75: k(s.salaryUsd.p75),
                        p90: k(s.salaryUsd.p90),
                      }
                    : null,
                  token_or_equity_share: `${Math.round(s.tokenEquityShare * 100)}%`,
                  remote_worldwide_share: `${Math.round(s.remoteWorldwideShare * 100)}%`,
                  top_ecosystems: s.topEcosystems.slice(0, 8),
                  top_roles: s.topRoles.slice(0, 8),
                  source: SITE_URL,
                  generated_at: s.generatedAt,
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
      "submit_job",
      {
        title: "Submit a job to ChainWork",
        description:
          "Submit a crypto / web3 / AI x crypto engineering role to ChainWork on behalf of a hiring company. Agents are welcome here. The submission enters a moderation queue (it is NOT published instantly) and goes live only after a human review. Call list_filters first to use valid ecosystem, role, seniority, and location values.",
        inputSchema: {
          submitter_email: z
            .string()
            .describe("Contact email of the submitter — used for follow-up"),
          company_name: z.string().describe("Hiring company name"),
          company_website: z
            .string()
            .optional()
            .describe("Company website, e.g. https://example.com"),
          title: z.string().describe("Job title, e.g. 'Senior Rust Engineer'"),
          role_category: z
            .string()
            .describe(`Role slug. One of: ${ALLOWED_ROLES}`),
          seniority: z
            .string()
            .describe(`Seniority. One of: ${ALLOWED_SENIORITY}`),
          employment_type: z
            .enum(EMPLOYMENT_TYPES)
            .describe("Employment type"),
          ecosystems: z
            .array(z.string())
            .describe(`At least one ecosystem. Allowed: ${ALLOWED_ECOS}`),
          location: z
            .string()
            .describe(`Remote-scope slug. One of: ${ALLOWED_LOCATIONS}`),
          salary_min_usd: z
            .number()
            .int()
            .optional()
            .describe("Annual minimum salary in USD (whole dollars)"),
          salary_max_usd: z
            .number()
            .int()
            .optional()
            .describe("Annual maximum salary in USD (whole dollars)"),
          has_token_or_equity: z.boolean().optional(),
          description_md: z
            .string()
            .describe(
              "Full role description in Markdown — at least 120 characters",
            ),
          apply_url: z
            .string()
            .optional()
            .describe("Application URL (provide this or apply_email)"),
          apply_email: z
            .string()
            .optional()
            .describe("Application email (provide this or apply_url)"),
        },
      },
      async (a) => {
        const candidate = {
          submitterEmail: a.submitter_email ?? "",
          companyName: a.company_name ?? "",
          companyWebsite: a.company_website ?? "",
          title: a.title ?? "",
          roleCategory:
            ROLE_OPTIONS.find((r) => r.value === a.role_category)?.category ??
            a.role_category ??
            "",
          seniority: a.seniority ?? "",
          employmentType: a.employment_type,
          ecosystems: a.ecosystems ?? [],
          location: a.location ?? "",
          salaryMin: a.salary_min_usd != null ? String(a.salary_min_usd) : "",
          salaryMax: a.salary_max_usd != null ? String(a.salary_max_usd) : "",
          salaryCurrency: "USD" as const,
          hasTokenEquity: a.has_token_or_equity ?? false,
          descriptionMd: a.description_md ?? "",
          applyUrl: a.apply_url ?? "",
          applyEmail: a.apply_email ?? "",
          note: "Submitted via MCP submit_job",
        };

        const parsed = submissionSchema.safeParse(candidate);
        if (!parsed.success) {
          const issues = parsed.error.issues
            .map((i) => `${i.path.join(".") || "form"}: ${i.message}`)
            .join("; ");
          return {
            content: [
              {
                type: "text",
                text: `Submission rejected. Fix and retry: ${issues}. Call list_filters for valid values.`,
              },
            ],
            isError: true,
          };
        }

        try {
          await db.insert(jobSubmissions).values({
            status: "pending",
            submitterEmail: parsed.data.submitterEmail.trim().toLowerCase(),
            data: parsed.data,
            note: parsed.data.note,
          });
        } catch (err) {
          console.error("MCP submit_job failed:", err);
          return {
            content: [
              { type: "text", text: "Internal error saving the submission." },
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
                  status: "pending_review",
                  message:
                    "Submission received and queued for human moderation. It will appear publicly once approved.",
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
      version: "1.1.0",
    },
    instructions:
      "ChainWork is the agent-native registry for crypto, web3, and AI x crypto engineering roles. Tools: list_filters (valid filter values — call first), search_jobs (browse/filter), get_job (full posting by slug), get_market_stats (salary percentiles + market snapshot), submit_job (post a role into the moderation queue). Salaries are USD-annual min–max ranges. Every job has a public apply URL. Agents are first-class clients here.",
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: false,
  },
);

export { handler as GET, handler as POST };
