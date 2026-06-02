import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView, type RelatedGroup } from "@/components/collections/collection-view";
import { getCollectionResult } from "@/db/queries";
import { buildItemListJsonLd } from "@/lib/collection-json-ld";
import {
  ROLE_COLLECTIONS,
  ECO_COLLECTIONS,
  getRoleCollection,
  getEcoCollection,
  ecoCounts,
  roleCounts,
  comboIntro,
} from "@/lib/collections";

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return ROLE_COLLECTIONS.flatMap((r) =>
    ECO_COLLECTIONS.map((e) => ({ role: r.slug, eco: e.slug })),
  );
}

type Params = { params: Promise<{ role: string; eco: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { role: roleSlug, eco: ecoSlug } = await params;
  const role = getRoleCollection(roleSlug);
  const eco = getEcoCollection(ecoSlug);
  if (!role || !eco) return { title: "Not found" };

  const { total } = await getCollectionResult(role.slug, eco.key);
  const path = `/roles/${role.slug}/${eco.slug}`;
  const title = `${eco.name} ${role.label} Jobs`;
  const description = comboIntro(role, eco, total).slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: total === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title: `${title} · Chainwork`, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ComboPage({ params }: Params) {
  const { role: roleSlug, eco: ecoSlug } = await params;
  const role = getRoleCollection(roleSlug);
  const eco = getEcoCollection(ecoSlug);
  if (!role || !eco) notFound();

  // The combo set + the two parent sets (cached) drive the cross-links.
  const [combo, roleSet, ecoSet] = await Promise.all([
    getCollectionResult(role.slug, eco.key),
    getCollectionResult(role.slug, null),
    getCollectionResult(null, eco.key),
  ]);
  const path = `/roles/${role.slug}/${eco.slug}`;

  // Sibling ecosystems for this role + sibling disciplines for this eco.
  const ecoDist = ecoCounts(roleSet.jobs);
  const sameRoleOtherEco = ECO_COLLECTIONS.filter(
    (e) => e.slug !== eco.slug && ecoDist[e.key] > 0,
  )
    .sort((a, b) => ecoDist[b.key] - ecoDist[a.key])
    .map((e) => ({
      label: e.name,
      href: `/roles/${role.slug}/${e.slug}`,
      count: ecoDist[e.key],
    }));

  const roleDist = roleCounts(ecoSet.jobs);
  const sameEcoOtherRole = ROLE_COLLECTIONS.filter(
    (r) => r.slug !== role.slug && roleDist[r.category] > 0,
  )
    .sort((a, b) => roleDist[b.category] - roleDist[a.category])
    .map((r) => ({
      label: r.label,
      href: `/roles/${r.slug}/${eco.slug}`,
      count: roleDist[r.category],
    }));

  const related: RelatedGroup[] = [];
  if (sameRoleOtherEco.length) {
    related.push({
      heading: `${role.label} in other ecosystems`,
      links: sameRoleOtherEco,
    });
  }
  if (sameEcoOtherRole.length) {
    related.push({
      heading: `Other ${eco.name} disciplines`,
      links: sameEcoOtherRole,
    });
  }

  const jsonLd = buildItemListJsonLd({
    name: `${eco.name} ${role.label} jobs`,
    description: comboIntro(role, eco, combo.total),
    path,
    jobs: combo.jobs,
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
          { label: role.label, href: `/roles/${role.slug}` },
          { label: eco.name },
        ]}
        kicker={`${eco.name} · ${role.label} · ${combo.total} open`}
        h1={`${eco.name} ${role.label} jobs`}
        intro={comboIntro(role, eco, combo.total)}
        jobs={combo.jobs}
        related={related}
      />
    </>
  );
}
