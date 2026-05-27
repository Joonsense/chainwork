import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Share2 } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { EcoBadge } from "@/components/ui/eco-badge";
import { JobMarkdown } from "@/components/jobs/job-markdown";
import { JsonLdCard } from "@/components/jobs/json-ld-card";
import { SaveButton } from "@/components/jobs/save-button";
import { StickyApplyBar } from "@/components/jobs/sticky-apply-bar";
import { ViewTracker } from "@/components/jobs/view-tracker";
import { getJobBySlug } from "@/db/queries";
import { formatSalary, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return { title: "Job not found · chainwork" };

  const description = (job.oneLiner ?? job.descriptionMd)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const title = `${job.title} at ${job.company.name} · chainwork`;

  return {
    title,
    description,
    openGraph: {
      title: `${job.title} at ${job.company.name}`,
      description,
      type: "website",
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
  const jsonLdPretty = JSON.stringify(job.jsonLd, null, 2);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chainwork-tau.vercel.app";
  const jobUrl = `${siteUrl}/jobs/${slug}`;
  const tweetText = encodeURIComponent(
    `${job.title} at ${company.name} — ${formatSalary(job.salaryMin, job.salaryMax)} · ${job.location}\n\n${jobUrl}\n\n#crypto #web3 #jobs`,
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <div className="min-h-dvh">
      {/* JSON-LD — read by schema.org validators, Google for Jobs, and agents */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(job.jsonLd) }}
      />

      {/* Fire-and-forget view count increment */}
      <ViewTracker slug={slug} />

      <GlassNav />

      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />

        <article className="relative mx-auto max-w-[760px] px-5 pb-12 pt-4 md:pt-6">
          {/* breadcrumb */}
          <nav className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-text-tertiary">
            <span>chainwork</span>
            <ChevronRight size={11} className="shrink-0 text-text-muted" />
            <span>Jobs</span>
            <ChevronRight size={11} className="shrink-0 text-text-muted" />
            <span className="truncate text-text-secondary">{slug}</span>
          </nav>

          {/* company header */}
          <div className="mt-5 flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line text-[15px] font-semibold"
              style={{ background: company.logoBg, color: company.logoFg }}
            >
              {company.logoText}
            </span>
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
            <JobMarkdown>{job.descriptionMd}</JobMarkdown>
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

          <Section label="Machine-readable">
            <JsonLdCard json={jsonLdPretty} />
          </Section>
        </article>
      </main>

      <StickyApplyBar slug={slug} />
    </div>
  );
}
