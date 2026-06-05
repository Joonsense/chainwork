import { ArrowRight, Check } from "lucide-react";
import { EcoBadge } from "@/components/ui/eco-badge";
import {
  SalaryPill,
  LocationPill,
  SkillTag,
  SponsoredBadge,
} from "@/components/ui/job-pills";
import { SaveButton } from "@/components/jobs/save-button";
import { relativeTime, firstParagraph } from "@/lib/format";
import type { JobWithCompany } from "@/db/queries";

/**
 * Latest-feed row. Compensation-first hierarchy. Below sm the right-hand
 * apply column drops into a footer so the row never overflows at 390px.
 *
 * A stretched link makes the whole row navigable while the bookmark
 * button stays independently clickable (`relative z-10`).
 */
export function ListRow({
  job,
  showBlurb = false,
}: {
  job: JobWithCompany;
  showBlurb?: boolean;
}) {
  const { company } = job;
  return (
    <div className="group relative block px-4 py-4 transition-colors hover:bg-glass sm:px-[18px]">
      <a
        href={`/jobs/${job.slug}`}
        aria-label={job.title}
        className="absolute inset-0 z-0"
      />
      <div className="flex gap-3.5 sm:gap-4">
        {/* logo */}
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line text-[14px] font-semibold"
          style={{ background: company.logoBg, color: company.logoFg }}
        >
          {company.logoText}
        </span>

        {/* body */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* top meta — comp + location + type + bookmark */}
          <div className="flex flex-wrap items-center gap-1.5">
            <SalaryPill min={job.salaryMin} max={job.salaryMax} size="sm" />
            <LocationPill location={job.location} size="sm" />
            <span className="text-[11.5px] text-text-tertiary">
              {job.employmentType}
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              {job.isSponsored && <SponsoredBadge />}
              <SaveButton slug={job.slug} size="sm" />
            </span>
          </div>

          {/* title */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-text-primary">
              {job.title}
            </span>
            {job.isVerified && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-accent-green">
                <Check size={10} strokeWidth={2.6} />
                verified
              </span>
            )}
          </div>

          {/* company */}
          <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
            <span className="font-medium text-text-bright">{company.name}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-tertiary">
              {company.stage} · {company.size}
            </span>
          </div>

          {/* blurb */}
          {showBlurb && (
            <p className="line-clamp-2 max-w-[620px] text-[13px] leading-[1.55] text-text-secondary">
              {firstParagraph(job.descriptionMd)}
            </p>
          )}

          {/* skills + ecosystems */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {job.skills.slice(0, 3).map((s) => (
              <SkillTag key={s}>{s}</SkillTag>
            ))}
            {job.ecosystems.length > 0 && (
              <span className="mx-1 h-3 w-px bg-line" />
            )}
            {job.ecosystems.map((e) => (
              <EcoBadge key={e} ecosystem={e} />
            ))}
          </div>
        </div>

        {/* right column — sm and up */}
        <div className="hidden shrink-0 flex-col items-end justify-between gap-3 sm:flex">
          <span className="whitespace-nowrap font-mono text-[10.5px] text-text-tertiary">
            {relativeTime(job.postedAt)} ago
          </span>
          <a
            href={`/jobs/${job.slug}/apply`}
            target="_blank"
            rel="noopener noreferrer"
            className="cw-apply relative z-10 h-9 px-4 text-[13px]"
          >
            Apply
            <ArrowRight size={12} strokeWidth={2.4} />
          </a>
        </div>
      </div>

      {/* footer — below sm only */}
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-line pt-3 sm:hidden">
        <span className="font-mono text-[10.5px] text-text-tertiary">
          {relativeTime(job.postedAt)} ago
        </span>
        <a
          href={`/jobs/${job.slug}/apply`}
          target="_blank"
          rel="noopener noreferrer"
          className="cw-apply relative z-10 h-8 px-3.5 text-[12px]"
        >
          Apply
          <ArrowRight size={11} strokeWidth={2.4} />
        </a>
      </div>
    </div>
  );
}
