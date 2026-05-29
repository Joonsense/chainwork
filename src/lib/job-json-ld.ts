/**
 * schema.org/JobPosting JSON-LD builder — the SINGLE source of truth.
 *
 * Precomputed at write time and stored on the row (jobs.json_ld), then
 * dropped straight into <head> and served by the agent API. The seed, the
 * post-a-job form, and all three ATS mappers write jobs, so the shape lives
 * here once. A backfill script recomputes it for existing rows.
 *
 * Correctness rules that matter for Google Rich Results + AEO ingestion:
 *  - `baseSalary` is OMITTED when no salary is disclosed (0/0). Emitting
 *    minValue:0/maxValue:0 makes Google flag the posting as invalid.
 *  - Remote roles use `jobLocationType: TELECOMMUTE` +
 *    `applicantLocationRequirements`, and carry NO physical `jobLocation`
 *    (a "Remote" PostalAddress is not a real place and is rejected).
 *  - On-site / hybrid roles carry a real `jobLocation`, no TELECOMMUTE.
 *  - `validThrough` is always stamped — Google warns without it.
 */
export type JobPostingInput = {
  title: string;
  /** Full role description (markdown/plain). Richer is better for rich results. */
  description: string;
  slug: string;
  postedAt: Date;
  /** "Full-time" | "Contract" (our DB form) — anything else maps to FULL_TIME. */
  employmentType: string;
  /** Worldwide · Americas · Europe · APAC · EMEA — set only for remote roles. */
  remoteScope: string | null;
  /** Free-text location, e.g. "Remote" or "San Francisco, CA". */
  location: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  company: { name: string; website: string | null };
};

/** 30 days — the validity window stamped onto every posting. */
const VALIDITY_MS = 30 * 86_400_000;

/** A role is remote when it has a remote scope or its location reads "remote". */
function isRemote(input: Pick<JobPostingInput, "remoteScope" | "location">): boolean {
  return Boolean(input.remoteScope) || /remote/i.test(input.location);
}

/** schema.org baseSalary, or undefined when nothing is disclosed. */
function baseSalary(
  input: Pick<JobPostingInput, "salaryMin" | "salaryMax" | "salaryCurrency">,
): Record<string, unknown> | undefined {
  const { salaryMin, salaryMax, salaryCurrency } = input;
  if (salaryMin <= 0 && salaryMax <= 0) return undefined;

  const value: Record<string, unknown> = {
    "@type": "QuantitativeValue",
    unitText: "YEAR",
  };
  if (salaryMin > 0 && salaryMax > 0) {
    value.minValue = salaryMin;
    value.maxValue = salaryMax;
  } else {
    // One-sided range — emit a single value so Google still renders it.
    value.value = salaryMin > 0 ? salaryMin : salaryMax;
  }

  return {
    "@type": "MonetaryAmount",
    currency: salaryCurrency || "USD",
    value,
  };
}

export function buildJobPostingJsonLd(
  job: JobPostingInput,
): Record<string, unknown> {
  const remote = isRemote(job);

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.postedAt.toISOString(),
    validThrough: new Date(job.postedAt.getTime() + VALIDITY_MS).toISOString(),
    employmentType:
      job.employmentType === "Contract" ? "CONTRACTOR" : "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      sameAs: job.company.website ?? undefined,
    },
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: "Chainwork",
      value: job.slug,
    },
  };

  if (remote) {
    ld.jobLocationType = "TELECOMMUTE";
    ld.applicantLocationRequirements = {
      "@type": "Country",
      name: job.remoteScope ?? "Worldwide",
    };
  } else {
    ld.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
      },
    };
  }

  const salary = baseSalary(job);
  if (salary) ld.baseSalary = salary;

  return ld;
}
