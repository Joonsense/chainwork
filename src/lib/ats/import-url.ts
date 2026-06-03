/**
 * Import a single job from a pasted ATS URL.
 *
 * The daily ingest already parses whole Greenhouse / Lever / Ashby boards
 * (lib/ats/ingest.ts). This reuses the SAME per-job mappers to turn one
 * pasted job link into pre-filled /submit fields — so an employer pastes
 * their existing posting instead of re-typing 12 fields. On-brand: we read
 * the public ATS API, we never scrape rendered HTML.
 *
 * The mappers expect a CompanyEntry; for an ad-hoc import we synthesise a
 * minimal one from the URL slug (only its slug/name/ecosystems are read, and
 * the job-row output is projected down to the lean submission shape).
 */

import { fetchAshbyJobs, type AshbyJob } from "./ashby";
import type { GreenhouseJob } from "./greenhouse";
import type { LeverJob } from "./lever";
import type { ATSType, CompanyEntry } from "./companies";
import { mapGreenhouseJob, mapLeverJob, mapAshbyJob } from "./mapper";
import { ROLE_CATEGORIES } from "@/lib/post-schema";
import { ECOSYSTEM_OPTIONS } from "@/lib/jobs-search-params";
import type { SubmissionForm } from "@/lib/submission-schema";

export type ImportedFields = Partial<SubmissionForm>;

export type ImportResult =
  | { ok: true; fields: ImportedFields; source: ATSType }
  | { ok: false; error: string };

type Parsed = { atsType: ATSType; atsSlug: string; jobId: string };

const TIMEOUT_MS = 10_000;

/** Identify the ATS, board slug, and job id from a pasted careers URL. */
export function parseAtsUrl(raw: string): Parsed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const segs = url.pathname.split("/").filter(Boolean);

  // ── Greenhouse ──────────────────────────────────────────
  // boards.greenhouse.io/{slug}/jobs/{id}, job-boards.greenhouse.io/...,
  // boards.eu.greenhouse.io/..., or an embed link with ?for=&gh_jid=
  if (host.endsWith("greenhouse.io")) {
    const jobsIdx = segs.indexOf("jobs");
    if (jobsIdx > 0 && segs[jobsIdx + 1]) {
      return {
        atsType: "greenhouse",
        atsSlug: segs[jobsIdx - 1],
        jobId: segs[jobsIdx + 1].replace(/\D/g, ""),
      };
    }
    const forSlug = url.searchParams.get("for");
    const ghJid = url.searchParams.get("gh_jid") ?? url.searchParams.get("token");
    if (forSlug && ghJid) {
      return { atsType: "greenhouse", atsSlug: forSlug, jobId: ghJid.replace(/\D/g, "") };
    }
    return null;
  }

  // ── Lever ───────────────────────────────────────────────
  // jobs.lever.co/{slug}/{uuid}
  if (host.endsWith("lever.co")) {
    if (segs[0] && segs[1]) {
      return { atsType: "lever", atsSlug: segs[0], jobId: segs[1] };
    }
    return null;
  }

  // ── Ashby ───────────────────────────────────────────────
  // jobs.ashbyhq.com/{slug}/{uuid}[/application]
  if (host.endsWith("ashbyhq.com")) {
    if (segs[0] && segs[1]) {
      return { atsType: "ashby", atsSlug: segs[0], jobId: segs[1] };
    }
    return null;
  }

  return null;
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "chainwork-import/1.0" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Pretty company name from an ATS slug, e.g. "my-protocol" → "My Protocol". */
function prettifySlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** A throwaway CompanyEntry — the mappers only read slug/name/ecosystems. */
function syntheticCompany(slug: string): CompanyEntry {
  return {
    name: prettifySlug(slug),
    slug,
    website: "",
    atsType: "greenhouse",
    atsSlug: slug,
    ecosystems: [],
    logoText: slug.slice(0, 2).toUpperCase(),
    logoBg: "#1a1a1a",
    logoFg: "#ffffff",
  };
}

/**
 * Project a mapped job row (DB shape) down to the lean /submit form fields.
 * Drops everything the public form derives on publish (logo, slug, json-ld).
 */
function projectToSubmission(
  job: NonNullable<ReturnType<typeof mapGreenhouseJob>>,
  companyName: string,
): ImportedFields {
  const ecosystems = (job.ecosystems ?? []).filter((e) =>
    ECOSYSTEM_OPTIONS.includes(e),
  );
  const roleCategory = ROLE_CATEGORIES.includes(job.roleCategory)
    ? job.roleCategory
    : "";
  return {
    companyName,
    title: job.title,
    roleCategory,
    seniority: job.seniority as SubmissionForm["seniority"],
    employmentType: job.employmentType as SubmissionForm["employmentType"],
    ecosystems,
    // The form's location dropdown is a remote-scope enum; almost every ATS
    // crypto role is remote, so default there and let the poster refine.
    location: "remote_worldwide",
    salaryMin: job.salaryMin > 0 ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax > 0 ? String(job.salaryMax) : "",
    salaryCurrency: "USD",
    descriptionMd: job.descriptionMd,
    applyUrl: job.applyUrl ?? "",
  };
}

const NOT_ENGINEERING =
  "That looks like a non-engineering role. Chainwork only lists crypto / web3 engineering roles.";

/**
 * Fetch + map one ATS posting into pre-filled submission fields.
 * Never throws — returns a typed result with a user-facing error string.
 */
export async function importJobFromUrl(raw: string): Promise<ImportResult> {
  const parsed = parseAtsUrl(raw);
  if (!parsed) {
    return {
      ok: false,
      error:
        "Paste a Greenhouse, Lever, or Ashby job link (e.g. boards.greenhouse.io/acme/jobs/123).",
    };
  }
  const { atsType, atsSlug, jobId } = parsed;
  const company = syntheticCompany(atsSlug);

  if (atsType === "greenhouse") {
    const data = (await getJson(
      `https://boards-api.greenhouse.io/v1/boards/${atsSlug}/jobs/${jobId}?content=true`,
    )) as GreenhouseJob | null;
    if (!data?.title) {
      return { ok: false, error: "Couldn't fetch that Greenhouse job. Check the link." };
    }
    const mapped = mapGreenhouseJob(
      { ...data, departments: data.departments ?? [], offices: data.offices ?? [] },
      company,
      "",
    );
    if (!mapped) return { ok: false, error: NOT_ENGINEERING };
    return { ok: true, fields: projectToSubmission(mapped, company.name), source: atsType };
  }

  if (atsType === "lever") {
    const data = (await getJson(
      `https://api.lever.co/v0/postings/${atsSlug}/${jobId}?mode=json`,
    )) as LeverJob | null;
    if (!data?.text) {
      return { ok: false, error: "Couldn't fetch that Lever job. Check the link." };
    }
    const mapped = mapLeverJob(data, company, "");
    if (!mapped) return { ok: false, error: NOT_ENGINEERING };
    return { ok: true, fields: projectToSubmission(mapped, company.name), source: atsType };
  }

  // Ashby has no single-job public endpoint; pull the board and match by id.
  const board = await fetchAshbyJobs(atsSlug);
  const job: AshbyJob | undefined = board?.find((j) => j.id === jobId);
  if (!job) {
    return { ok: false, error: "Couldn't find that Ashby job. Check the link." };
  }
  const mapped = mapAshbyJob(job, company, "");
  if (!mapped) return { ok: false, error: NOT_ENGINEERING };
  return { ok: true, fields: projectToSubmission(mapped, company.name), source: "ashby" };
}
