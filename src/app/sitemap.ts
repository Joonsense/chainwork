import type { MetadataRoute } from "next";
import { getAllJobs } from "@/db/queries";
import { SITE_URL } from "@/lib/site";
import {
  ROLE_COLLECTIONS,
  ECO_COLLECTIONS,
  ecoCounts,
  roleCounts,
} from "@/lib/collections";

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
    {
      url: `${SITE_URL}/directory`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const jobRoutes: MetadataRoute.Sitemap = allJobs.map((job) => ({
    url: `${SITE_URL}/jobs/${job.slug}`,
    lastModified: job.indexedAt, // closest field to an updated_at
    changeFrequency: "daily",
    priority: job.isFeatured ? 0.8 : 0.6,
  }));

  /* Programmatic AEO surface (P16) — only POPULATED collections are listed;
     empty ones are noindex, so a sitemap entry would contradict that. */
  const eco = ecoCounts(allJobs);
  const role = roleCounts(allJobs);

  const roleRoutes: MetadataRoute.Sitemap = ROLE_COLLECTIONS.filter(
    (r) => role[r.category] > 0,
  ).map((r) => ({
    url: `${SITE_URL}/roles/${r.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const ecoRoutes: MetadataRoute.Sitemap = ECO_COLLECTIONS.filter(
    (e) => eco[e.key] > 0,
  ).map((e) => ({
    url: `${SITE_URL}/ecosystems/${e.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // Discipline × ecosystem cells that currently hold at least one role.
  const comboSeen = new Set<string>();
  for (const j of allJobs) {
    for (const e of j.ecosystems) comboSeen.add(`${j.roleCategory}|${e}`);
  }
  const comboRoutes: MetadataRoute.Sitemap = ROLE_COLLECTIONS.flatMap((r) =>
    ECO_COLLECTIONS.filter((e) => comboSeen.has(`${r.category}|${e.key}`)).map(
      (e) => ({
        url: `${SITE_URL}/roles/${r.slug}/${e.slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.6,
      }),
    ),
  );

  // NOTE: company URLs are intentionally omitted — there is no
  // /companies/[slug] route yet, and a sitemap must not list pages that
  // 404. Add a `companyRoutes` block here once company pages ship.

  return [
    ...staticRoutes,
    ...roleRoutes,
    ...ecoRoutes,
    ...comboRoutes,
    ...jobRoutes,
  ];
}
