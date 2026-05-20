import type { Metadata } from "next";
import { GlassNav } from "@/components/layout/glass-nav";
import { ECOSYSTEMS } from "@/lib/ecosystems";
import { getServerSession } from "@/lib/auth";
import {
  loadJobsSearchParams,
  ROLE_OPTIONS,
  LOCATION_OPTIONS,
  SALARY_MIN,
  SALARY_MAX,
  type JobFilters,
} from "@/lib/jobs-search-params";
import { AlertsForm } from "./alerts-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Job alerts · chainwork",
  description: "Get new web3 roles matching your filters, by email.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Human-readable chips for the filters carried in from /jobs. */
function filterChips(f: JobFilters): string[] {
  const chips: string[] = [];
  if (f.q.trim()) chips.push(`“${f.q.trim()}”`);
  for (const e of f.eco) chips.push(ECOSYSTEMS[e]?.label ?? e.toUpperCase());
  for (const r of f.role)
    chips.push(ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r);
  for (const s of f.seniority) chips.push(s);
  for (const l of f.loc)
    chips.push(LOCATION_OPTIONS.find((o) => o.value === l)?.label ?? l);
  if (f.min > SALARY_MIN || f.max < SALARY_MAX)
    chips.push(`$${f.min}k–$${f.max}k`);
  if (f.token) chips.push("Token / equity");
  return chips;
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await loadJobsSearchParams(searchParams);
  const session = await getServerSession();

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[560px] px-5 pb-24 pt-6 md:pt-10">
          <header className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              Never miss a role
            </span>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-text-primary md:text-[32px]">
              Job alerts
            </h1>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              New roles matching your filters, delivered by email. No account
              needed — just confirm your address.
            </p>
          </header>

          <AlertsForm
            filters={filters}
            chips={filterChips(filters)}
            defaultEmail={session?.user.email ?? ""}
          />
        </div>
      </main>
    </div>
  );
}
