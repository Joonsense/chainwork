import { ArrowRight, Check, Sparkles } from "lucide-react";
import { EcoBadge } from "@/components/ui/eco-badge";
import { SalaryPill, LocationPill, SkillTag } from "@/components/ui/job-pills";
import { relativeTime, firstParagraph } from "@/lib/format";
import type { JobWithCompany } from "@/db/queries";

/**
 * Featured job card — the large "High-signal roles" slot.
 * `accent` adds the animated conic border to the lead card.
 */
export function FeaturedCard({
  job,
  accent = false,
}: {
  job: JobWithCompany;
  accent?: boolean;
}) {
  const { company } = job;
  return (
    <a
      href={`/jobs/${job.slug}`}
      className={`cw-card cw-card-glow flex h-full flex-col gap-3.5 rounded-2xl p-5 ${
        accent ? "cw-bordered" : ""
      }`}
    >
      {/* company header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line text-[13px] font-semibold"
            style={{ background: company.logoBg, color: company.logoFg }}
          >
            {company.logoText}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-text-bright">
              <span className="truncate">{company.name}</span>
              {company.verified && (
                <Check size={11} strokeWidth={2.6} className="shrink-0 text-accent-green" />
              )}
            </div>
            <div className="text-[10.5px] text-text-tertiary">
              {company.stage} · {company.size}
            </div>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-[5px] border border-accent-purple/40 bg-accent-purple/15 px-1.5 py-0.5 font-mono text-[9px] text-accent-purple">
          <Sparkles size={9} strokeWidth={0} className="fill-current" />
          featured
        </span>
      </div>

      {/* title */}
      <h3 className="text-[19px] font-semibold leading-[1.2] tracking-[-0.02em] text-text-primary">
        {job.title}
      </h3>

      {/* comp + location */}
      <div className="flex flex-wrap gap-1.5">
        <SalaryPill min={job.salaryMin} max={job.salaryMax} />
        <LocationPill location={job.location} />
      </div>

      {/* blurb */}
      <p className="line-clamp-2 flex-1 text-[13px] leading-[1.55] text-text-secondary">
        {firstParagraph(job.descriptionMd)}
      </p>

      {/* skills + ecosystems */}
      <div className="flex flex-wrap items-center gap-1">
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

      {/* footer */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-line pt-3">
        <span className="truncate font-mono text-[11px] text-text-tertiary">
          {relativeTime(job.postedAt)} ago · {job.employmentType}
        </span>
        <span className="cw-apply h-[30px] shrink-0 px-3 text-[12px]">
          Apply
          <ArrowRight size={11} strokeWidth={2.4} />
        </span>
      </div>
    </a>
  );
}
