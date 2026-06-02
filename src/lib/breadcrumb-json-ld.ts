/**
 * schema.org/BreadcrumbList JSON-LD.
 *
 * Every collection and job page already renders a visible breadcrumb trail;
 * mirroring it as structured data earns the breadcrumb rich-result treatment
 * in search and lets answer engines reconstruct the site hierarchy (which
 * discipline / ecosystem a page belongs to) when citing a page.
 *
 * The last crumb is the current page and conventionally carries no link, but
 * Google wants every item to resolve, so each crumb here takes a path.
 */
import { SITE_URL } from "@/lib/site";

export type Crumb = {
  name: string;
  /** Site-relative path, e.g. "/roles/protocol". */
  path: string;
};

export function buildBreadcrumbList(crumbs: Crumb[]): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

/** Standalone BreadcrumbList document (its own <script>), for pages with no other JSON-LD graph. */
export function buildBreadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return { "@context": "https://schema.org", ...buildBreadcrumbList(crumbs) };
}
