import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { CompanyLogo } from "@/components/ui/company-logo";
import { EcoBadge } from "@/components/ui/eco-badge";
import {
  SalaryPill,
  LocationPill,
  SkillTag,
  SponsoredBadge,
} from "@/components/ui/job-pills";
import { SaveButton } from "@/components/jobs/save-button";
import { relativeTime, plainTextExcerpt } from "@/lib/format";
import type { JobWithCompany } from "@/db/queries";

/**
 * Latest-feed row. Compensation-first hierarchy. Below sm the right-hand
 * apply column drops into a footer so the row never overflows at 390px.
 *
 * A stretched link makes the whole row navigable while the bookmark
 * button stays independently clickable (`relative z-10`).
 *
 * Merged-card props (optional, set by the display layer in lib/job-display):
 *  - `locations`   distinct locations across near-duplicate variants
 *  - `variants`    each variant's slug+location, rendered as deep links so the
 *                  individual roles (and their apply URLs) stay reachable
 *  - `salaryRange` the widest disclosed range across variants
 */
export function ListRow({
  job,
  showBlurb = false,
  locations,
  variants,
  salaryRange,
}: {
  job: JobWithCompany;
  showBlurb?: boolean;
  locations?: string[];
  variants?: { slug: string; location: string }[];
  salaryRange?: { min: number; max: number };
}) {
  const { company } = job;
  const sMin = salaryRange?.min ?? job.salaryMin;
  const sMax = salaryRange?.max ?? job.salaryMax;
  const locs = locations && locations.length ? locations : [job.location];
  const merged = locs.length > 1;
  return (
    <div className="group relative block px-4 py-4 transition-colors hover:bg-glass sm:px-[18px]">
      <a
        href={`/jobs/${job.slug}`}
        aria-label={job.title}
        className="absolute inset-0 z-0"
      />
      <div className="flex gap-3.5 sm:gap-4">
        {/* logo */}
        <CompanyLogo
          name={company.name}
          website={company.website}
          logoText={company.logoText}
          logoBg={company.logoBg}
          logoFg={company.logoFg}
          className="h-11 w-11 rounded-[10px] border border-line text-[14px]"
        />

        {/* body */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* top meta, comp + location + type + bookmark */}
          <div className="flex flex-wrap items-center gap-1.5">
            <SalaryPill min={sMin} max={sMax} size="sm" />
            <LocationPill location={merged ? locs[0] : job.location} size="sm" />
            {merged && (
              <span
                title={locs.join(" · ")}
                className="rounded-md border border-line bg-glass-hi px-1.5 py-0.5 font-mono text-[10.5px] text-text-tertiary"
              >
                +{locs.length - 1} {locs.length - 1 === 1 ? "location" : "locations"}
              </span>
            )}
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

          {/* merged variants, individual roles stay reachable (z-10 over the
              stretched row link); apply URLs preserved per role */}
          {merged && variants && variants.length > 1 && (
            <div className="relative z-10 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10.5px] text-text-muted">
                Open in:
              </span>
              {variants.map((v) => (
                <a
                  key={v.slug}
                  href={`/jobs/${v.slug}`}
                  className="rounded-md border border-line bg-glass px-1.5 py-0.5 text-[11px] text-text-secondary transition-colors hover:border-strong hover:text-text-primary"
                >
                  {v.location || "View"}
                </a>
              ))}
            </div>
          )}

          {/* blurb */}
          {showBlurb && (
            <p className="line-clamp-2 max-w-[620px] text-[13px] leading-[1.55] text-text-secondary">
              {job.oneLiner?.trim() || plainTextExcerpt(job.descriptionMd, 180)}
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

        {/* right column, sm and up */}
        <div className="hidden shrink-0 flex-col items-end justify-between gap-3 sm:flex">
          <span className="whitespace-nowrap font-mono text-[10.5px] text-text-tertiary">
            {relativeTime(job.postedAt)} ago
          </span>
          <span className="cw-apply h-9 px-4 text-[13px]">
            Apply
            <ArrowRight size={12} strokeWidth={2.4} />
          </span>
        </div>
      </div>

      {/* footer, below sm only */}
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-line pt-3 sm:hidden">
        <span className="font-mono text-[10.5px] text-text-tertiary">
          {relativeTime(job.postedAt)} ago
        </span>
        <span className="cw-apply h-8 px-3.5 text-[12px]">
          Apply
          <ArrowRight size={11} strokeWidth={2.4} />
        </span>
      </div>
    </div>
  );
}

/**
 * "View all N roles from {company} →" — rendered after a company's last
 * visible card when the per-company display cap hid the rest. Links to the
 * single-company view (which releases the cap and shows them all).
 */
export function CompanyOverflowRow({
  companyName,
  companySlug,
  hidden,
}: {
  companyName: string;
  companySlug: string;
  hidden: number;
}) {
  return (
    <a
      href={`/jobs?company=${encodeURIComponent(companySlug)}`}
      className="flex items-center justify-center gap-1.5 bg-glass-hi/40 px-4 py-2.5 text-[12px] font-medium text-accent-blue transition-colors hover:bg-glass-hi"
    >
      View all {hidden} more {hidden === 1 ? "role" : "roles"} from {companyName}
      <ChevronRight size={13} strokeWidth={2.4} />
    </a>
  );
}
