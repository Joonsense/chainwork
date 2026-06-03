import { and, eq } from "drizzle-orm";
import { db, jobAlerts } from "@/db";
import { getMatchingJobsSince, type JobWithCompany } from "@/db/queries";
import { sendAlertDigestEmail } from "./email";
import {
  ROLE_OPTIONS,
  LOCATION_OPTIONS,
  SALARY_MIN,
  SALARY_MAX,
  type JobFilters,
} from "@/lib/jobs-search-params";

/** Fresh matches a daily/weekly digest must reach before it sends. */
const DIGEST_THRESHOLD = 5;
const DIGEST_LIMIT = 12;
const WEEK_MS = 7 * 86_400_000;

export const ALERT_FREQUENCIES = ["realtime", "daily", "weekly"] as const;
export type AlertFrequency = (typeof ALERT_FREQUENCIES)[number];

/** Coerce a stored jsonb filters blob into a complete JobFilters. */
export function normalizeFilters(raw: unknown): JobFilters {
  const f = (raw ?? {}) as Partial<JobFilters>;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  return {
    q: typeof f.q === "string" ? f.q : "",
    company: typeof f.company === "string" ? f.company : "",
    eco: arr(f.eco),
    role: arr(f.role),
    seniority: arr(f.seniority),
    loc: arr(f.loc),
    min: typeof f.min === "number" ? f.min : SALARY_MIN,
    max: typeof f.max === "number" ? f.max : SALARY_MAX,
    token: f.token === true,
    posted: "all", // alerts are bounded by lastSentAt, not a posted window
    sort: "newest",
  };
}

const digestRow = (job: JobWithCompany) => ({
  slug: job.slug,
  title: job.title,
  companyName: job.company.name,
  salaryMin: job.salaryMin,
  salaryMax: job.salaryMax,
});

/** In-memory predicate — does one job match a filter set? (realtime path) */
function jobMatchesFilters(job: JobWithCompany, f: JobFilters): boolean {
  if (f.q.trim()) {
    const hay =
      `${job.title} ${job.descriptionMd} ${job.skills.join(" ")}`.toLowerCase();
    const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.every((t) => hay.includes(t))) return false;
  }
  if (f.eco.length && !f.eco.some((e) => job.ecosystems.includes(e)))
    return false;
  if (f.role.length) {
    const slug = ROLE_OPTIONS.find(
      (o) => o.category === job.roleCategory,
    )?.value;
    if (!slug || !f.role.includes(slug)) return false;
  }
  if (f.seniority.length && !f.seniority.includes(job.seniority)) return false;
  if (f.loc.length) {
    const scopes = f.loc.map(
      (l) => LOCATION_OPTIONS.find((o) => o.value === l)?.scope,
    );
    if (!scopes.includes(job.remoteScope ?? undefined)) return false;
  }
  if (job.salaryMax < f.min * 1000) return false;
  if (job.salaryMin > f.max * 1000) return false;
  if (f.token && !job.hasTokenEquity) return false;
  return true;
}

/**
 * Realtime alerts — emails every verified realtime subscriber whose
 * filters match a freshly posted job. Called inline on job creation;
 * fine while subscriber counts are small.
 */
export async function sendRealtimeAlertsForJob(
  job: JobWithCompany,
): Promise<void> {
  const alerts = await db
    .select()
    .from(jobAlerts)
    .where(
      and(
        eq(jobAlerts.frequency, "realtime"),
        eq(jobAlerts.verified, true),
        eq(jobAlerts.active, true),
      ),
    );
  for (const alert of alerts) {
    if (!jobMatchesFilters(job, normalizeFilters(alert.filters))) continue;
    try {
      await sendAlertDigestEmail(alert.email, [digestRow(job)], alert.token, 1);
    } catch (err) {
      console.error(`realtime alert ${alert.id} failed:`, err);
    }
  }
}

/**
 * Daily/weekly digest run — for each verified subscriber, emails the
 * roles posted since their last digest, but only once at least
 * DIGEST_THRESHOLD have accumulated. Weekly alerts wait a full week.
 */
export async function runAlertDigest(): Promise<{
  sent: number;
  skipped: number;
}> {
  const now = new Date();
  const alerts = await db
    .select()
    .from(jobAlerts)
    .where(and(eq(jobAlerts.verified, true), eq(jobAlerts.active, true)));

  let sent = 0;
  let skipped = 0;

  for (const alert of alerts) {
    if (alert.frequency === "realtime") continue; // sent inline on post

    const since = alert.lastSentAt ?? alert.createdAt;

    if (
      alert.frequency === "weekly" &&
      now.getTime() - since.getTime() < WEEK_MS
    ) {
      skipped++;
      continue;
    }

    const matches = await getMatchingJobsSince(
      normalizeFilters(alert.filters),
      since,
    );
    if (matches.length < DIGEST_THRESHOLD) {
      skipped++;
      continue;
    }

    try {
      await sendAlertDigestEmail(
        alert.email,
        matches.slice(0, DIGEST_LIMIT).map(digestRow),
        alert.token,
        matches.length,
      );
      await db
        .update(jobAlerts)
        .set({ lastSentAt: now })
        .where(eq(jobAlerts.id, alert.id));
      sent++;
    } catch (err) {
      console.error(`digest for alert ${alert.id} failed:`, err);
      skipped++;
    }
  }

  return { sent, skipped };
}
