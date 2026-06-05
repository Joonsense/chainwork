import type { MetadataRoute } from "next";
import { getAllJobs } from "@/db/queries";
import { SITE_URL } from "@/lib/site";

/* Reflects the current job set on every build/request. */
export const dynamic = "force-dynamic";

/** Every indexable URL — static pages + one entry per live role. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allJobs = await getAllJobs();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE_URL}/jobs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/for-companies`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/mcp`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/pulse`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const jobRoutes: MetadataRoute.Sitemap = allJobs.map((job) => ({
    url: `${SITE_URL}/jobs/${job.slug}`,
    lastModified: job.indexedAt, // closest field to an updated_at
    changeFrequency: "daily",
    priority: job.isFeatured ? 0.8 : 0.6,
  }));

  // NOTE: company URLs are intentionally omitted — there is no
  // /companies/[slug] route yet, and a sitemap must not list pages that
  // 404. Add a `companyRoutes` block here once company pages ship.

  return [...staticRoutes, ...jobRoutes];
}
