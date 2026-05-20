import { Sparkles } from "lucide-react";
import { FilterGroup } from "./filter-group";
import { CheckboxGroup } from "./checkbox-group";
import { CompensationSlider } from "./compensation-slider";
import { PostedPills } from "./posted-pills";
import { TokenToggle, PlaceholderToggle, FilterReset } from "./filter-controls";
import { ECOSYSTEMS } from "@/lib/ecosystems";
import {
  LOCATION_OPTIONS,
  ROLE_OPTIONS,
  SENIORITY_LEVELS,
  ECOSYSTEM_OPTIONS,
} from "@/lib/jobs-search-params";
import type { FacetCounts } from "@/db/queries";

/** The filter sections — shared by the desktop sidebar and the mobile sheet. */
export function FilterGroups({ facets }: { facets: FacetCounts }) {
  return (
    <>
      <FilterGroup title="Compensation">
        <CompensationSlider />
        <div className="mt-2.5 border-t border-subtle pt-1.5">
          <TokenToggle />
          <PlaceholderToggle label="Salary disclosed" />
        </div>
      </FilterGroup>

      <FilterGroup title="Location">
        <CheckboxGroup
          paramKey="loc"
          options={LOCATION_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
            count: facets.loc[o.value] ?? 0,
          }))}
        />
      </FilterGroup>

      <FilterGroup title="Role category">
        <CheckboxGroup
          paramKey="role"
          options={ROLE_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
            count: facets.role[o.value] ?? 0,
          }))}
        />
      </FilterGroup>

      <FilterGroup title="Seniority">
        <CheckboxGroup
          paramKey="seniority"
          options={SENIORITY_LEVELS.map((s) => ({
            value: s,
            label: s,
            count: facets.seniority[s] ?? 0,
          }))}
        />
      </FilterGroup>

      <FilterGroup title="Posted">
        <PostedPills />
      </FilterGroup>

      <FilterGroup title="Ecosystem" note="optional">
        <CheckboxGroup
          paramKey="eco"
          options={ECOSYSTEM_OPTIONS.map((e) => ({
            value: e,
            label: ECOSYSTEMS[e]?.label ?? e,
            count: facets.eco[e] ?? 0,
            eco: e,
          }))}
        />
      </FilterGroup>

      <FilterGroup title="AI match" note="beta">
        <p className="text-[11px] leading-relaxed text-text-tertiary">
          Connect GitHub to re-rank every role by code-based fit.
        </p>
        <button
          type="button"
          disabled
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-glass py-1.5 text-[11.5px] text-text-tertiary"
        >
          <Sparkles size={11} className="text-accent-purple" />
          Coming in P10
        </button>
      </FilterGroup>
    </>
  );
}

/** Desktop filter sidebar. */
export function JobsFilterSidebar({
  facets,
  className = "",
}: {
  facets: FacetCounts;
  className?: string;
}) {
  return (
    <aside className={`self-start lg:sticky lg:top-20 ${className}`}>
      <div className="flex items-center justify-between pb-1">
        <span className="text-[13px] font-semibold text-text-primary">
          Filters
        </span>
        <FilterReset />
      </div>
      <FilterGroups facets={facets} />
    </aside>
  );
}
