import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Share2 } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { CompanyLogo } from "@/components/ui/company-logo";
import { EcoBadge } from "@/components/ui/eco-badge";
import { JobDescription } from "@/components/jobs/job-description";
import { JsonLdCard } from "@/components/jobs/json-ld-card";
import { ListRow } from "@/components/jobs/list-row";
import { SaveButton } from "@/components/jobs/save-button";
import { StickyApplyBar } from "@/components/jobs/sticky-apply-bar";
import { ViewTracker } from "@/components/jobs/view-tracker";
import { getJobBySlug, getAllJobs, getRelatedJobs } from "@/db/queries";
import { mergeNearDuplicates, cardKey } from "@/lib/job-display";
import { ROLE_COLLECTIONS, getEcoByKey } from "@/lib/collections";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-json-ld";
import { formatSalary, relativeTime, plainTextExcerpt } from "@/lib/format";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  return jobs.map((j) => ({ slug: j.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return { title: "Job not found" };

  const description = plainTextExcerpt(job.oneLiner ?? job.descriptionMd, 160);
  const title = `${job.title} at ${job.company.name}`;

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${slug}` },
    openGraph: {
      title: `${job.title} at ${job.company.name}`,
      description,
      type: "website",
      url: `/jobs/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/* ── local helpers ──────────────────────────────────────────── */

function MetaCell({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-tertiary">
        {label}
      </div>
      <div
        className={`mt-1 text-[14px] font-semibold text-text-primary ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
        {label}
      </h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-2.5 text-[14px] leading-[1.6] text-text-secondary"
        >
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-brand" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── page ───────────────────────────────────────────────────── */

export default async function JobDetailPage({ params }: Params) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const { company } = job;

  // "More roles" footer — same role category, near-duplicates merged, the
  // current role's own variants excluded. Keeps a reader moving to the next
  // posting instead of bouncing off the bottom of the page.
  const relatedRaw = await getRelatedJobs(job.roleCategory, job.id, 8);
  const currentKey = cardKey(job);
  const relatedCards = mergeNearDuplicates(relatedRaw)
    .filter((c) => c.key !== currentKey)
    .slice(0, 5);

  // Internal links into the AEO collection surface — feed crawl signal from the
  // 327 job pages to the role / ecosystem / combo landing pages we want cited.
  const roleCol = ROLE_COLLECTIONS.find((r) => r.category === job.roleCategory);
  const ecoCols = job.ecosystems
    .map((k) => getEcoByKey(k))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));
  const exploreLinks: { label: string; href: string }[] = [];
  if (roleCol)
    exploreLinks.push({ label: `${roleCol.label} jobs`, href: `/roles/${roleCol.slug}` });
  for (const e of ecoCols.slice(0, 3))
    exploreLinks.push({ label: `${e.name} jobs`, href: `/ecosystems/${e.slug}` });
  if (roleCol && ecoCols[0])
    exploreLinks.push({
      label: `${ecoCols[0].name} ${roleCol.label}`,
      href: `/roles/${roleCol.slug}/${ecoCols[0].slug}`,
    });

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "chainwork", path: "/" },
    { name: "Jobs", path: "/jobs" },
    { name: job.title, path: `/jobs/${slug}` },
  ]);
  // Refresh validThrough to serve time so Google never sees a stale expiry
  // (stored value is baked at ingest time; jobs older than 30d would appear expired)
  const liveJsonLd = {
    ...job.jsonLd,
    validThrough: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  };
  const jsonLdPretty = JSON.stringify(liveJsonLd, null, 2);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chainwork-tau.vercel.app";
  const jobUrl = `${siteUrl}/jobs/${slug}`;
  const tweetText = encodeURIComponent(
    `${job.title} at ${company.name}, ${formatSalary(job.salaryMin, job.salaryMax)} · ${job.location}\n\n${jobUrl}\n\n#crypto #web3 #jobs`,
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <div className="min-h-dvh">
      {/* JSON-LD, read by schema.org validators, Google for Jobs, and agents */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(liveJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Fire-and-forget view count increment */}
      <ViewTracker slug={slug} />

      <GlassNav />

      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />

        <article className="relative mx-auto max-w-[760px] px-5 pb-12 pt-4 md:pt-6">
          {/* breadcrumb */}
          <nav className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-text-tertiary">
            <Link href="/" className="cw-focus shrink-0 hover:text-text-secondary">
              chainwork
            </Link>
            <ChevronRight size={11} className="shrink-0 text-text-muted" />
            <Link href="/jobs" className="cw-focus shrink-0 hover:text-text-secondary">
              Jobs
            </Link>
            <ChevronRight size={11} className="shrink-0 text-text-muted" />
            <span className="truncate text-text-secondary">{job.title}</span>
          </nav>

          {/* company header */}
          <div className="mt-5 flex items-center gap-3">
            <CompanyLogo
              name={company.name}
              website={company.website}
              logoText={company.logoText}
              logoBg={company.logoBg}
              logoFg={company.logoFg}
              className="h-12 w-12 rounded-xl border border-line text-[15px]"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[14px] font-medium text-text-bright">
                <span className="truncate">{company.name}</span>
                {company.verified && (
                  <Check
                    size={13}
                    strokeWidth={2.6}
                    className="shrink-0 text-accent-green"
                  />
                )}
              </div>
              <div className="text-[12px] text-text-tertiary">
                {company.stage} · {company.size} · {job.location}
              </div>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-subtle bg-glass text-text-tertiary transition-colors hover:border-line hover:text-text-primary"
              >
                <Share2 size={14} />
              </a>
              <SaveButton slug={job.slug} />
            </div>
          </div>

          {/* title */}
          <h1 className="mt-4 text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-text-primary md:text-[34px]">
            {job.title}
          </h1>

          {/* ecosystems */}
          {job.ecosystems.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.ecosystems.map((e) => (
                <EcoBadge key={e} ecosystem={e} />
              ))}
            </div>
          )}

          {/* meta grid */}
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-subtle bg-subtle sm:grid-cols-4">
            <MetaCell
              label="Salary"
              mono
              value={formatSalary(job.salaryMin, job.salaryMax)}
            />
            <MetaCell label="Remote" value={job.remoteScope ?? "Remote"} />
            <MetaCell label="Type" value={job.employmentType} />
            <MetaCell
              label="Posted"
              value={`${relativeTime(job.postedAt)} ago`}
            />
          </div>

          {/* sections */}
          <Section label="About the role">
            <JobDescription content={job.descriptionMd} />
          </Section>

          <Section label="What you'll do">
            <BulletList items={job.responsibilities} />
          </Section>

          <Section label="Requirements">
            <BulletList items={job.requirements} />
          </Section>

          {job.niceToHave.length > 0 && (
            <Section label="Nice to have">
              <BulletList items={job.niceToHave} />
            </Section>
          )}

          {exploreLinks.length > 0 && (
            <Section label="Explore similar roles">
              <ul className="flex flex-wrap gap-2">
                {exploreLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-glass px-3 py-1.5 text-[12.5px] text-text-secondary transition-colors hover:border-line hover:text-text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {relatedCards.length > 0 && (
            <Section
              label={`More ${roleCol?.label ?? job.roleCategory} roles`}
            >
              <div className="cw-card overflow-hidden rounded-2xl">
                {relatedCards.map((card, i) => (
                  <div
                    key={card.primary.id}
                    className={i > 0 ? "border-t border-subtle" : ""}
                  >
                    <ListRow
                      job={card.primary}
                      locations={card.locations}
                      variants={
                        card.variants.length > 1
                          ? card.variants.map((v) => ({
                              slug: v.slug,
                              location: v.location,
                            }))
                          : undefined
                      }
                      salaryRange={{ min: card.salaryMin, max: card.salaryMax }}
                    />
                  </div>
                ))}
              </div>
              <Link
                href={roleCol ? `/roles/${roleCol.slug}` : "/jobs"}
                prefetch={false}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-blue transition-colors hover:text-text-primary"
              >
                View all {roleCol?.label ?? job.roleCategory} roles
                <ChevronRight size={13} strokeWidth={2.4} />
              </Link>
            </Section>
          )}

          <Section label="Machine-readable">
            <JsonLdCard json={jsonLdPretty} />
          </Section>
        </article>
      </main>

      <StickyApplyBar slug={slug} />
    </div>
  );
}
