import { cache } from "react";
import {
  and,
  or,
  desc,
  eq,
  ne,
  count,
  gte,
  lte,
  ilike,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { ECOSYSTEMS } from "@/lib/ecosystems";
import { db } from "./index";
import {
  jobs,
  companies,
  savedJobs,
  jobAlerts,
  type Job,
  type Company,
} from "./schema";
import {
  type JobFilters,
  LOCATION_OPTIONS,
  ROLE_OPTIONS,
  SENIORITY_LEVELS,
  ECOSYSTEM_OPTIONS,
} from "@/lib/jobs-search-params";
import { collectionFilters } from "@/lib/collections";

const categoryForRoleSlug = (slug: string): string | undefined =>
  ROLE_OPTIONS.find((o) => o.value === slug)?.category;

const roleSlugForCategory = (category: string): string | undefined =>
  ROLE_OPTIONS.find((o) => o.category === category)?.value;

export type JobWithCompany = Job & { company: Company };

/**
 * Jobs for a programmatic collection page (P16) — by role slug, ecosystem
 * key, or both. Wrapped in React `cache` and keyed on primitive args so
 * generateMetadata and the page component share one query per request.
 * Pass `null` (not undefined) for an unused axis to keep the cache key stable.
 */
export const getCollectionResult = cache(
  async (
    role: string | null,
    eco: string | null,
  ): Promise<{ jobs: JobWithCompany[]; total: number }> => {
    const filters = collectionFilters({
      role: role ?? undefined,
      eco: eco ?? undefined,
    });
    return searchJobs(filters, { limit: 400, offset: 0 });
  },
);

/**
 * Single job by slug, with its company. Wrapped in React `cache` so
 * generateMetadata and the page component share one query per request.
 */
export const getJobBySlug = cache(
  async (slug: string): Promise<JobWithCompany | null> => {
    const rows = await db
      .select()
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(jobs.slug, slug))
      .limit(1);
    if (rows.length === 0) return null;
    return { ...rows[0].jobs, company: rows[0].companies };
  },
);

/**
 * Home "High-signal roles" slots. Data-driven, no hand-picked seeds: any paid
 * Featured rows lead, then the highest-paying real roles that have a working
 * external apply link and a disclosed salary. This keeps the slot honest —
 * every card is a real, applyable, salary-transparent job.
 */
export async function getFeaturedJobs(limit = 3): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(sql`${jobs.applyUrl} IS NOT NULL`, gte(jobs.salaryMax, 1)))
    .orderBy(desc(jobs.isFeatured), desc(jobs.salaryMax), desc(jobs.postedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/**
 * Home "Latest roles" feed. Salary-transparent roles surface first — the
 * whole USP is salary transparency, so disclosed-pay roles lead, and within
 * each group the newest win. Keeps the feed honest about what we promise.
 */
export async function getLatestJobs(limit = 12): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .orderBy(sql`(${jobs.salaryMax} > 0 OR ${jobs.salaryMin} > 0) DESC`, desc(jobs.postedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/**
 * Related roles for a job detail page — same role category, newest first,
 * excluding the current job. Feeds the "more positions" footer that keeps a
 * reader moving to the next role instead of bouncing.
 */
export async function getRelatedJobs(
  roleCategory: string,
  excludeId: string,
  limit = 6,
): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(eq(jobs.roleCategory, roleCategory), ne(jobs.id, excludeId)))
    .orderBy(desc(jobs.postedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/** Every job + company, newest first — powers /llms.txt and the sitemap. */
export async function getAllJobs(): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .orderBy(desc(jobs.postedAt));
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/** All companies, A→Z — the "existing company" picker in the post form. */
export async function getAllCompanies(): Promise<Company[]> {
  return db.select().from(companies).orderBy(companies.name);
}

/** Slugs of the roles a user has saved — drives the bookmark state. */
export async function getSavedJobSlugs(userId: string): Promise<string[]> {
  const rows = await db
    .select({ slug: jobs.slug })
    .from(savedJobs)
    .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .where(eq(savedJobs.userId, userId));
  return rows.map((r) => r.slug);
}

/** A user's saved roles, most-recently-saved first — the /me/saved list. */
export async function getSavedJobs(userId: string): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(savedJobs)
    .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(savedJobs.userId, userId))
    .orderBy(desc(savedJobs.createdAt));
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/** Roles posted by a given signed-in user — the /me "your roles" list. */
export async function getJobsByPoster(
  userId: string,
): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.postedBy, userId))
    .orderBy(desc(jobs.postedAt));
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/** Live counts + freshest index time for the hero counter. */
export async function getHomeStats(): Promise<{
  jobs: number;
  companies: number;
  lastIndexedAt: Date | null;
}> {
  const [[jobAgg], [companyAgg], [recent]] = await Promise.all([
    db.select({ value: count() }).from(jobs),
    db.select({ value: count() }).from(companies),
    db
      .select({ indexedAt: jobs.indexedAt })
      .from(jobs)
      .orderBy(desc(jobs.indexedAt))
      .limit(1),
  ]);
  return {
    jobs: jobAgg?.value ?? 0,
    companies: companyAgg?.value ?? 0,
    lastIndexedAt: recent?.indexedAt ?? null,
  };
}

/**
 * Real salary insight from disclosed-pay roles only — powers the home rail.
 * Returns null when too few roles disclose pay to be meaningful, so the UI can
 * hide the panel rather than show an invented number. `sampleSize` is the count
 * of roles the median is computed from (shown for honesty).
 */
export async function getSalaryInsight(): Promise<{
  medianMax: number;
  minMin: number;
  maxMax: number;
  sampleSize: number;
} | null> {
  const [row] = await db
    .select({
      medianMax: sql<number>`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${jobs.salaryMax})`,
      minMin: sql<number>`min(${jobs.salaryMin})`,
      maxMax: sql<number>`max(${jobs.salaryMax})`,
      sampleSize: count(),
    })
    .from(jobs)
    .where(gte(jobs.salaryMax, 1));

  if (!row || row.sampleSize < 5) return null;
  return {
    medianMax: Math.round(Number(row.medianMax)),
    minMin: Number(row.minMin),
    maxMax: Number(row.maxMax),
    sampleSize: Number(row.sampleSize),
  };
}

/** Verified, active job-alert subscribers — the only honest "subscribers" number. */
export async function getSubscriberCount(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(jobAlerts)
    .where(and(eq(jobAlerts.verified, true), eq(jobAlerts.active, true)));
  return row?.value ?? 0;
}

/* ── /jobs filtering + search (P4) ──────────────────────────── */

function postedCutoff(posted: JobFilters["posted"]): Date | null {
  if (posted === "all") return null;
  const days = posted === "24h" ? 1 : posted === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 86_400_000);
}

const scopeForLoc = (loc: string): string | undefined =>
  LOCATION_OPTIONS.find((o) => o.value === loc)?.scope;

/** Full-text search over title, description, and skills. */
function ftsCondition(q: string): SQL {
  return sql`to_tsvector('english', ${jobs.title} || ' ' || ${jobs.descriptionMd} || ' ' || ${jobs.skills}::text) @@ plainto_tsquery('english', ${q})`;
}

function buildConditions(f: JobFilters): SQL[] {
  const c: SQL[] = [];
  if (f.q.trim()) c.push(ftsCondition(f.q.trim()));
  if (f.company?.trim()) {
    // Subquery (not a join) so this also applies to the COUNT query, which
    // selects from `jobs` alone.
    c.push(
      inArray(
        jobs.companyId,
        db
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.slug, f.company.trim())),
      ),
    );
  }
  if (f.eco.length) {
    c.push(
      or(
        ...f.eco.map(
          (e) => sql`${jobs.ecosystems} @> ${JSON.stringify([e])}::jsonb`,
        ),
      )!,
    );
  }
  if (f.role.length) {
    const cats = f.role
      .map(categoryForRoleSlug)
      .filter((c): c is string => Boolean(c));
    if (cats.length) c.push(inArray(jobs.roleCategory, cats));
  }
  if (f.seniority.length) c.push(inArray(jobs.seniority, f.seniority));
  if (f.loc.length) {
    const scopes = f.loc
      .map(scopeForLoc)
      .filter((s): s is string => Boolean(s));
    if (scopes.length) c.push(inArray(jobs.remoteScope, scopes));
  }
  c.push(gte(jobs.salaryMax, f.min * 1000));
  c.push(lte(jobs.salaryMin, f.max * 1000));
  if (f.token) c.push(eq(jobs.hasTokenEquity, true));
  const cutoff = postedCutoff(f.posted);
  if (cutoff) c.push(gte(jobs.postedAt, cutoff));
  return c;
}

/** Filtered, sorted, paginated job results + the matching total. */
export async function searchJobs(
  f: JobFilters,
  opts: { limit: number; offset: number },
): Promise<{ jobs: JobWithCompany[]; total: number }> {
  const where = and(...buildConditions(f));
  // Paid/featured roles pin to the top of every sort (the expire-featured cron
  // clears the flag once the paid window ends).
  const orderBy =
    f.sort === "salary"
      ? [desc(jobs.isFeatured), desc(jobs.salaryMax), desc(jobs.postedAt)]
      : [desc(jobs.isFeatured), desc(jobs.postedAt), desc(jobs.id)];

  const [rows, [tot]] = await Promise.all([
    db
      .select()
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(opts.limit)
      .offset(opts.offset),
    db.select({ value: count() }).from(jobs).where(where),
  ]);

  return {
    jobs: rows.map((r) => ({ ...r.jobs, company: r.companies })),
    total: tot?.value ?? 0,
  };
}

/** Jobs matching an alert's filters, posted after `since` — newest first. */
export async function getMatchingJobsSince(
  f: JobFilters,
  since: Date | null,
): Promise<JobWithCompany[]> {
  const conds = buildConditions(f);
  if (since) conds.push(gte(jobs.postedAt, since));
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(...conds))
    .orderBy(desc(jobs.postedAt));
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

export type FacetCounts = {
  eco: Record<string, number>;
  role: Record<string, number>;
  seniority: Record<string, number>;
  loc: Record<string, number>;
};

/** Faceted counts — each group is counted with its OWN filter removed. */
export async function getFacetCounts(f: JobFilters): Promise<FacetCounts> {
  const pool = await db
    .select({
      ecosystems: jobs.ecosystems,
      roleCategory: jobs.roleCategory,
      seniority: jobs.seniority,
      remoteScope: jobs.remoteScope,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      hasTokenEquity: jobs.hasTokenEquity,
      postedAt: jobs.postedAt,
    })
    .from(jobs)
    .where(f.q.trim() ? ftsCondition(f.q.trim()) : undefined);

  const cutoff = postedCutoff(f.posted);
  type Row = (typeof pool)[number];

  const matches = (r: Row, except: string): boolean => {
    if (
      except !== "eco" &&
      f.eco.length &&
      !f.eco.some((e) => r.ecosystems.includes(e))
    )
      return false;
    if (except !== "role" && f.role.length) {
      const slug = roleSlugForCategory(r.roleCategory);
      if (!slug || !f.role.includes(slug)) return false;
    }
    if (
      except !== "seniority" &&
      f.seniority.length &&
      !f.seniority.includes(r.seniority)
    )
      return false;
    if (except !== "loc" && f.loc.length) {
      const scopes = f.loc.map(scopeForLoc);
      if (!scopes.includes(r.remoteScope ?? undefined)) return false;
    }
    if (r.salaryMax < f.min * 1000) return false;
    if (r.salaryMin > f.max * 1000) return false;
    if (f.token && !r.hasTokenEquity) return false;
    if (cutoff && r.postedAt < cutoff) return false;
    return true;
  };

  const tally = (
    except: string,
    keys: string[],
    keyOf: (r: Row) => string[] | string,
  ): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const k of keys) out[k] = 0;
    for (const r of pool) {
      if (!matches(r, except)) continue;
      const v = keyOf(r);
      for (const k of Array.isArray(v) ? v : [v]) {
        if (k in out) out[k] += 1;
      }
    }
    return out;
  };

  return {
    eco: tally("eco", ECOSYSTEM_OPTIONS, (r) => r.ecosystems),
    role: tally(
      "role",
      ROLE_OPTIONS.map((o) => o.value),
      (r) => roleSlugForCategory(r.roleCategory) ?? [],
    ),
    seniority: tally("seniority", SENIORITY_LEVELS, (r) => r.seniority),
    loc: tally(
      "loc",
      LOCATION_OPTIONS.map((o) => o.value),
      (r) => {
        const opt = LOCATION_OPTIONS.find((o) => o.scope === r.remoteScope);
        return opt ? opt.value : [];
      },
    ),
  };
}

/* ── Command palette search (P5) ────────────────────────────── */

export type PaletteJob = {
  slug: string;
  title: string;
  company: string;
  logoText: string;
  logoBg: string;
  logoFg: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  applyUrl: string | null;
  applyEmail: string | null;
};

export type PaletteCompany = {
  slug: string;
  name: string;
  logoText: string;
  logoBg: string;
  logoFg: string;
  stage: string | null;
  size: string | null;
  focus: string | null;
};

export type PaletteResult = {
  jobs: PaletteJob[];
  jobsTotal: number;
  companies: PaletteCompany[];
  companiesTotal: number;
  ecosystems: { key: string; label: string; count: number }[];
};

/** Powers /api/search — top jobs, matching companies, inferred ecosystems. */
export async function searchPalette(q: string): Promise<PaletteResult> {
  const term = q.trim();
  if (!term) {
    return {
      jobs: [],
      jobsTotal: 0,
      companies: [],
      companiesTotal: 0,
      ecosystems: [],
    };
  }

  const jobRows = await db
    .select({
      slug: jobs.slug,
      title: jobs.title,
      ecosystems: jobs.ecosystems,
      location: jobs.location,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      applyUrl: jobs.applyUrl,
      applyEmail: jobs.applyEmail,
      company: companies.name,
      logoText: companies.logoText,
      logoBg: companies.logoBg,
      logoFg: companies.logoFg,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(ftsCondition(term))
    .orderBy(desc(jobs.postedAt));

  // Infer ecosystems — the top ecosystems among the matched roles.
  const ecoTally: Record<string, number> = {};
  for (const r of jobRows) {
    for (const e of r.ecosystems) ecoTally[e] = (ecoTally[e] ?? 0) + 1;
  }
  const ecosystems = Object.entries(ecoTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => ({
      key,
      label: ECOSYSTEMS[key]?.label ?? key.toUpperCase(),
      count,
    }));

  const companyRows = await db
    .select({
      slug: companies.slug,
      name: companies.name,
      logoText: companies.logoText,
      logoBg: companies.logoBg,
      logoFg: companies.logoFg,
      stage: companies.stage,
      size: companies.size,
      focus: companies.focus,
    })
    .from(companies)
    .where(ilike(companies.name, `%${term}%`))
    .orderBy(companies.name);

  return {
    jobs: jobRows.slice(0, 5).map((r) => ({
      slug: r.slug,
      title: r.title,
      company: r.company,
      logoText: r.logoText,
      logoBg: r.logoBg,
      logoFg: r.logoFg,
      location: r.location,
      salaryMin: r.salaryMin,
      salaryMax: r.salaryMax,
      applyUrl: r.applyUrl,
      applyEmail: r.applyEmail,
    })),
    jobsTotal: jobRows.length,
    companies: companyRows.slice(0, 3),
    companiesTotal: companyRows.length,
    ecosystems,
  };
}

/* ── Pulse dashboard (P11) ───────────────────────────────────── */

export type PulseStats = {
  totalJobs: number;
  totalCompanies: number;
  jobsThisWeek: number;
  jobsToday: number;
  ecosystemBreakdown: Array<{ eco: string; count: number }>;
  roleBreakdown: Array<{ role: string; count: number }>;
  topCompanies: Array<{ name: string; slug: string; website: string | null; logoText: string; logoBg: string; logoFg: string; count: number }>;
};

export async function getPulseStats(): Promise<PulseStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const dayAgo = new Date(now.getTime() - 86_400_000);

  const [allJobs, totalCompaniesRes, weekCount, todayCount] = await Promise.all([
    db
      .select({
        ecosystems: jobs.ecosystems,
        roleCategory: jobs.roleCategory,
        companyId: jobs.companyId,
      })
      .from(jobs),
    db.select({ value: count() }).from(companies),
    db.select({ value: count() }).from(jobs).where(gte(jobs.postedAt, weekAgo)),
    db.select({ value: count() }).from(jobs).where(gte(jobs.postedAt, dayAgo)),
  ]);

  // Ecosystem breakdown
  const ecoTally: Record<string, number> = {};
  const roleTally: Record<string, number> = {};
  for (const j of allJobs) {
    for (const e of j.ecosystems) {
      ecoTally[e] = (ecoTally[e] ?? 0) + 1;
    }
    roleTally[j.roleCategory] = (roleTally[j.roleCategory] ?? 0) + 1;
  }

  const ecosystemBreakdown = Object.entries(ecoTally)
    .sort((a, b) => b[1] - a[1])
    .map(([eco, count]) => ({ eco, count }));

  const roleBreakdown = Object.entries(roleTally)
    .sort((a, b) => b[1] - a[1])
    .map(([role, count]) => ({ role, count }));

  // Top hiring companies
  const companyJobCounts = await db
    .select({
      name: companies.name,
      slug: companies.slug,
      website: companies.website,
      logoText: companies.logoText,
      logoBg: companies.logoBg,
      logoFg: companies.logoFg,
      count: count(jobs.id),
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .groupBy(companies.id, companies.name, companies.slug, companies.website, companies.logoText, companies.logoBg, companies.logoFg)
    .orderBy(desc(count(jobs.id)))
    .limit(10);

  return {
    totalJobs: allJobs.length,
    totalCompanies: totalCompaniesRes[0]?.value ?? 0,
    jobsThisWeek: weekCount[0]?.value ?? 0,
    jobsToday: todayCount[0]?.value ?? 0,
    ecosystemBreakdown,
    roleBreakdown,
    topCompanies: companyJobCounts,
  };
}

/* ── Market stats (AEO data asset + MCP get_market_stats) ─────── */

export type MarketStats = {
  totalJobs: number;
  totalCompanies: number;
  disclosedSalaryCount: number;
  salaryUsd: {
    p10: number;
    p25: number;
    median: number;
    p75: number;
    p90: number;
  } | null;
  tokenEquityShare: number; // 0–1
  remoteWorldwideShare: number; // 0–1
  topEcosystems: Array<{ eco: string; label: string; count: number }>;
  topRoles: Array<{ role: string; count: number }>;
  generatedAt: string;
};

const pct = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
};

/**
 * Aggregate market stats over the live job pool. Salary figures use the
 * midpoint of each disclosed range. This is the citable, agent-readable
 * snapshot the crypto boards don't expose — powers /data and the MCP
 * get_market_stats tool. Cached per request.
 */
export const getMarketStats = cache(async (): Promise<MarketStats> => {
  const [rows, [companyAgg]] = await Promise.all([
    db
      .select({
        ecosystems: jobs.ecosystems,
        roleCategory: jobs.roleCategory,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        hasTokenEquity: jobs.hasTokenEquity,
        remoteScope: jobs.remoteScope,
      })
      .from(jobs),
    db.select({ value: count() }).from(companies),
  ]);

  const midpoints: number[] = [];
  const ecoTally: Record<string, number> = {};
  const roleTally: Record<string, number> = {};
  let tokenCount = 0;
  let remoteWw = 0;

  for (const r of rows) {
    if (r.salaryMax > 0 || r.salaryMin > 0) {
      const lo = r.salaryMin > 0 ? r.salaryMin : r.salaryMax;
      const hi = r.salaryMax > 0 ? r.salaryMax : r.salaryMin;
      midpoints.push(Math.round((lo + hi) / 2));
    }
    if (r.hasTokenEquity) tokenCount += 1;
    if (r.remoteScope === "Worldwide") remoteWw += 1;
    for (const e of r.ecosystems) ecoTally[e] = (ecoTally[e] ?? 0) + 1;
    roleTally[r.roleCategory] = (roleTally[r.roleCategory] ?? 0) + 1;
  }

  midpoints.sort((a, b) => a - b);

  return {
    totalJobs: rows.length,
    totalCompanies: companyAgg?.value ?? 0,
    disclosedSalaryCount: midpoints.length,
    salaryUsd:
      midpoints.length > 0
        ? {
            p10: pct(midpoints, 10),
            p25: pct(midpoints, 25),
            median: pct(midpoints, 50),
            p75: pct(midpoints, 75),
            p90: pct(midpoints, 90),
          }
        : null,
    tokenEquityShare: rows.length ? tokenCount / rows.length : 0,
    remoteWorldwideShare: rows.length ? remoteWw / rows.length : 0,
    topEcosystems: Object.entries(ecoTally)
      .sort((a, b) => b[1] - a[1])
      .map(([eco, c]) => ({
        eco,
        label: ECOSYSTEMS[eco]?.label ?? eco.toUpperCase(),
        count: c,
      })),
    topRoles: Object.entries(roleTally)
      .sort((a, b) => b[1] - a[1])
      .map(([role, c]) => ({ role, count: c })),
    generatedAt: new Date().toISOString(),
  };
});

/** Top jobs by view count — powers the Trending section. */
export async function getTrendingJobs(limit = 6): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .orderBy(desc(jobs.viewCount), desc(jobs.postedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/** Increment view count for a job by slug. Fire-and-forget safe. */
export async function incrementViewCount(slug: string): Promise<void> {
  await db
    .update(jobs)
    .set({ viewCount: sql`${jobs.viewCount} + 1` })
    .where(eq(jobs.slug, slug));
}
