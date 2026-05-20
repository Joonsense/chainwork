/**
 * schema.org/JobPosting JSON-LD builder.
 *
 * Precomputed at write time and stored on the row (jobs.json_ld), then
 * dropped straight into <head> and served by the agent API. The seed and
 * the post-a-job form both write jobs, so the shape lives here once.
 */
export type JobPostingInput = {
  title: string;
  descriptionMd: string;
  slug: string;
  postedAt: Date;
  employmentType: string; // "Full-time" | "Contract"
  remoteScope: string | null;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  company: { name: string; website: string | null };
};

/** 30 days — the validity window stamped onto every posting. */
const VALIDITY_MS = 30 * 86_400_000;

export function buildJobPostingJsonLd(
  job: JobPostingInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.descriptionMd,
    datePosted: job.postedAt.toISOString(),
    validThrough: new Date(job.postedAt.getTime() + VALIDITY_MS).toISOString(),
    employmentType:
      job.employmentType === "Contract" ? "CONTRACTOR" : "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      sameAs: job.company.website ?? undefined,
    },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: {
      "@type": "Country",
      name: job.remoteScope ?? "Worldwide",
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency,
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: "YEAR",
      },
    },
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: "Chainwork",
      value: job.slug,
    },
  };
}
