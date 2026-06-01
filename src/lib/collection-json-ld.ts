/**
 * schema.org/ItemList JSON-LD for collection pages (P16 AEO surface).
 *
 * Collection pages (role / ecosystem / combo) are lists of roles, so the
 * correct structured-data type is ItemList — Google and AEO engines read it
 * to understand "this page is a curated set of N job postings" and to surface
 * the set as a unit. Each item points at the canonical job URL; the full
 * JobPosting JSON-LD lives on the individual `/jobs/{slug}` page.
 */
import type { JobWithCompany } from "@/db/queries";
import { SITE_URL } from "@/lib/site";

export function buildItemListJsonLd(opts: {
  name: string;
  description: string;
  /** Absolute or site-relative path of the collection page, e.g. "/roles/protocol". */
  path: string;
  jobs: JobWithCompany[];
}): Record<string, unknown> {
  const url = `${SITE_URL}${opts.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    description: opts.description,
    url,
    numberOfItems: opts.jobs.length,
    itemListElement: opts.jobs.map((job, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/jobs/${job.slug}`,
      name: `${job.title} at ${job.company.name}`,
    })),
  };
}
