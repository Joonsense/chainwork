import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView, type RelatedGroup } from "@/components/collections/collection-view";
import { getCollectionResult } from "@/db/queries";
import { buildItemListJsonLd } from "@/lib/collection-json-ld";
import {
  ROLE_COLLECTIONS,
  ECO_COLLECTIONS,
  getRoleCollection,
  ecoCounts,
  roleIntro,
} from "@/lib/collections";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ role: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { role: slug } = await params;
  const role = getRoleCollection(slug);
  if (!role) return { title: "Role not found" };

  const { total } = await getCollectionResult(role.slug, null);
  const path = `/roles/${role.slug}`;
  const title = `${role.label} Jobs in Crypto`;
  const description = roleIntro(role, total).slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: path },
    // Don't index a list with nothing on it — protect crawl budget / quality.
    robots: total === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title: `${title} · Chainwork`, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RolePage({ params }: Params) {
  const { role: slug } = await params;
  const role = getRoleCollection(slug);
  if (!role) notFound();

  const { jobs, total } = await getCollectionResult(role.slug, null);
  const path = `/roles/${role.slug}`;

  // Ecosystem cross-links — only the ones that actually have roles here.
  const counts = ecoCounts(jobs);
  const ecoLinks = ECO_COLLECTIONS.filter((e) => counts[e.key] > 0)
    .sort((a, b) => counts[b.key] - counts[a.key])
    .map((e) => ({
      label: e.name,
      href: `/roles/${role.slug}/${e.slug}`,
      count: counts[e.key],
    }));

  const related: RelatedGroup[] = [];
  if (ecoLinks.length) {
    related.push({ heading: `${role.label} by ecosystem`, links: ecoLinks });
  }
  related.push({
    heading: "Other disciplines",
    links: ROLE_COLLECTIONS.filter((r) => r.slug !== role.slug).map((r) => ({
      label: r.label,
      href: `/roles/${r.slug}`,
    })),
  });

  const jsonLd = buildItemListJsonLd({
    name: `${role.label} jobs in crypto`,
    description: roleIntro(role, total),
    path,
    jobs,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionView
        breadcrumb={[
          { label: "chainwork", href: "/" },
          { label: "Roles", href: "/directory" },
          { label: role.label },
        ]}
        kicker={`Role · ${total} open`}
        h1={`${role.label} jobs in crypto & web3`}
        intro={roleIntro(role, total)}
        jobs={jobs}
        related={related}
      />
    </>
  );
}
