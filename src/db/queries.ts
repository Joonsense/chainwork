import { cache } from "react";
import {
  and,
  or,
  desc,
  eq,
  count,
  gte,
  lte,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "./index";
import { jobs, companies, type Job, type Company } from "./schema";
import {
  type JobFilters,
  LOCATION_OPTIONS,
  ROLE_OPTIONS,
  SENIORITY_LEVELS,
  ECOSYSTEM_OPTIONS,
} from "@/lib/jobs-search-params";

const categoryForRoleSlug = (slug: string): string | undefined =>
  ROLE_OPTIONS.find((o) => o.value === slug)?.category;

const roleSlugForCategory = (category: string): string | undefined =>
  ROLE_OPTIONS.find((o) => o.category === category)?.value;

export type JobWithCompany = Job & { company: Company };

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

/** Featured roles, newest first — the home "High-signal roles" slots. */
export async function getFeaturedJobs(limit = 3): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.isFeatured, true))
    .orderBy(desc(jobs.postedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.jobs, company: r.companies }));
}

/** Newest roles — the home "Latest roles" feed. */
export async function getLatestJobs(limit = 12): Promise<JobWithCompany[]> {
  const rows = await db
    .select()
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .orderBy(desc(jobs.postedAt))
    .limit(limit);
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
  const orderBy =
    f.sort === "salary"
      ? [desc(jobs.salaryMax), desc(jobs.postedAt)]
      : [desc(jobs.postedAt), desc(jobs.id)];

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
