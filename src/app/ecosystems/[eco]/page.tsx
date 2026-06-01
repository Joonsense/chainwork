import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView, type RelatedGroup } from "@/components/collections/collection-view";
import { getCollectionResult } from "@/db/queries";
import { buildItemListJsonLd } from "@/lib/collection-json-ld";
import {
  ROLE_COLLECTIONS,
  ECO_COLLECTIONS,
  getEcoCollection,
  roleCounts,
  ecoIntro,
} from "@/lib/collections";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ eco: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { eco: slug } = await params;
  const eco = getEcoCollection(slug);
  if (!eco) return { title: "Ecosystem not found" };

  const { total } = await getCollectionResult(null, eco.key);
  const path = `/ecosystems/${eco.slug}`;
  const title = `${eco.name} Jobs`;
  const description = ecoIntro(eco, total).slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: total === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title: `${title} · Chainwork`, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EcosystemPage({ params }: Params) {
  const { eco: slug } = await params;
  const eco = getEcoCollection(slug);
  if (!eco) notFound();

  const { jobs, total } = await getCollectionResult(null, eco.key);
  const path = `/ecosystems/${eco.slug}`;

  // Role cross-links — only disciplines that actually have roles in this eco.
  const counts = roleCounts(jobs);
  const roleLinks = ROLE_COLLECTIONS.filter((r) => counts[r.category] > 0)
    .sort((a, b) => counts[b.category] - counts[a.category])
    .map((r) => ({
      label: r.label,
      href: `/roles/${r.slug}/${eco.slug}`,
      count: counts[r.category],
    }));

  const related: RelatedGroup[] = [];
  if (roleLinks.length) {
    related.push({ heading: `${eco.name} roles by discipline`, links: roleLinks });
  }
  related.push({
    heading: "Other ecosystems",
    links: ECO_COLLECTIONS.filter((e) => e.slug !== eco.slug).map((e) => ({
      label: e.name,
      href: `/ecosystems/${e.slug}`,
    })),
  });

  const jsonLd = buildItemListJsonLd({
    name: `${eco.name} engineering jobs`,
    description: ecoIntro(eco, total),
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
          { label: "Ecosystems", href: "/directory" },
          { label: eco.name },
        ]}
        kicker={`Ecosystem · ${total} open`}
        h1={`${eco.name} crypto engineering jobs`}
        intro={ecoIntro(eco, total)}
        jobs={jobs}
        related={related}
      />
    </>
  );
}
