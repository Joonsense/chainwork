"use client";

import { useFormContext } from "react-hook-form";
import { Check } from "lucide-react";
import type { Company } from "@/db/schema";
import type { JobWithCompany } from "@/db/queries";
import { ListRow } from "@/components/jobs/list-row";
import { JobMarkdown } from "@/components/jobs/job-markdown";
import { EcoBadge } from "@/components/ui/eco-badge";
import { formatSalary } from "@/lib/format";
import { resolveLocation, type PostForm } from "@/lib/post-schema";
import { ToggleField } from "./wizard-fields";

const PLACEHOLDER_COMPANY: Company = {
  id: "preview",
  slug: "preview",
  name: "Select a company",
  logoText: "—",
  logoBg: "#1c1c25",
  logoFg: "#f5f5f7",
  stage: null,
  size: null,
  focus: null,
  hq: null,
  ecosystems: [],
  website: null,
  verified: false,
  createdAt: new Date(),
};

const trimmed = (rows: { value: string }[]): string[] =>
  rows.map((r) => r.value.trim()).filter(Boolean);

/** Assembles a JobWithCompany from live form values, for the preview. */
function buildPreview(v: PostForm, companies: Company[]): JobWithCompany {
  const now = new Date();
  const company: Company =
    v.companyMode === "existing"
      ? (companies.find((c) => c.id === v.companyId) ?? PLACEHOLDER_COMPANY)
      : {
          id: "preview",
          slug: v.slug || "preview",
          name: v.name || "New company",
          logoText: (v.logoText || "—").toUpperCase(),
          logoBg: v.logoBg,
          logoFg: v.logoFg,
          stage: v.stage || null,
          size: v.size || null,
          focus: v.oneLiner || null,
          hq: v.hq || null,
          ecosystems: v.companyEcosystems,
          website: v.website || null,
          verified: false,
          createdAt: now,
        };
  const { location, remoteScope } = resolveLocation(v.location);

  return {
    id: "preview",
    slug: "preview",
    companyId: company.id,
    postedBy: null,
    title: v.title || "Untitled role",
    descriptionMd: v.descriptionMd || "",
    responsibilities: trimmed(v.responsibilities),
    requirements: trimmed(v.requirements),
    niceToHave: trimmed(v.niceToHave),
    oneLiner: null,
    roleCategory: v.roleCategory || "—",
    seniority: v.seniority,
    employmentType: v.employmentType,
    location,
    remoteScope,
    salaryMin: Number(v.salaryMin) || 0,
    salaryMax: Number(v.salaryMax) || 0,
    salaryCurrency: v.salaryCurrency,
    hasTokenEquity: v.hasTokenEquity,
    ecosystems: v.jobEcosystems,
    skills: trimmed(v.skills),
    isFeatured: v.isFeatured,
    featuredUntil: null,
    isSponsored: false,
    isVerified: company.verified,
    applyUrl: v.applyUrl || null,
    applyEmail: v.applyEmail || null,
    applyCount: 0,
    source: "manual",
    externalId: null,
    viewCount: 0,
    jsonLd: {},
    postedAt: now,
    indexedAt: now,
    createdAt: now,
    company,
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
      {children}
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-text-tertiary">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-semibold text-text-primary">
        {value}
      </div>
    </div>
  );
}

function Bullets({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
        {heading}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 text-[13.5px] leading-[1.6] text-text-secondary"
          >
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailPreview({ job }: { job: JobWithCompany }) {
  const { company } = job;
  return (
    <div className="rounded-2xl border border-subtle bg-surface p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line text-[14px] font-semibold"
          style={{ background: company.logoBg, color: company.logoFg }}
        >
          {company.logoText}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-text-bright">
            <span className="truncate">{company.name}</span>
            {company.verified && (
              <Check
                size={12}
                strokeWidth={2.6}
                className="shrink-0 text-accent-green"
              />
            )}
          </div>
          <div className="text-[12px] text-text-tertiary">
            {[company.stage, company.size, job.location]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </div>

      <h2 className="mt-4 text-[22px] font-semibold leading-[1.18] tracking-[-0.02em] text-text-primary">
        {job.title}
      </h2>

      {job.ecosystems.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {job.ecosystems.map((e) => (
            <EcoBadge key={e} ecosystem={e} />
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-subtle bg-subtle">
        <MetaCell
          label="Salary"
          value={formatSalary(job.salaryMin, job.salaryMax)}
        />
        <MetaCell label="Remote" value={job.remoteScope ?? "Remote"} />
        <MetaCell label="Type" value={job.employmentType} />
      </div>

      {job.descriptionMd.trim() && (
        <div className="mt-5">
          <h3 className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
            About the role
          </h3>
          <JobMarkdown>{job.descriptionMd}</JobMarkdown>
        </div>
      )}
      {job.responsibilities.length > 0 && (
        <Bullets heading="What you'll do" items={job.responsibilities} />
      )}
      {job.requirements.length > 0 && (
        <Bullets heading="Requirements" items={job.requirements} />
      )}
      {job.niceToHave.length > 0 && (
        <Bullets heading="Nice to have" items={job.niceToHave} />
      )}
    </div>
  );
}

export function StepReview({ companies }: { companies: Company[] }) {
  const { watch } = useFormContext<PostForm>();
  const job = buildPreview(watch(), companies);

  return (
    <div className="space-y-7">
      <div>
        <SectionLabel>Visibility</SectionLabel>
        <ToggleField
          name="isFeatured"
          label="Feature this role — $199 / 2 weeks"
          description="Pinned to the top of the home page and the /jobs feed for 14 days. Publishing takes you to secure checkout; the role goes live either way."
        />
      </div>

      <div>
        <SectionLabel>Card preview — latest feed</SectionLabel>
        <div className="pointer-events-none overflow-hidden rounded-2xl border border-subtle">
          <ListRow job={job} showBlurb />
        </div>
      </div>

      <div>
        <SectionLabel>Detail page preview</SectionLabel>
        <DetailPreview job={job} />
      </div>
    </div>
  );
}
