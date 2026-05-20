"use client";

import { useQueryStates } from "nuqs";
import { X } from "lucide-react";
import {
  jobsSearchParams,
  SALARY_MIN,
  SALARY_MAX,
  LOCATION_OPTIONS,
  ROLE_OPTIONS,
} from "@/lib/jobs-search-params";
import { ECOSYSTEMS } from "@/lib/ecosystems";

type Chip = { key: string; label: string; clear: () => void };

/** The row of removable chips for every currently-active filter. */
export function ActiveFilters() {
  const [f, setF] = useQueryStates(jobsSearchParams);

  const chips: Chip[] = [];

  for (const e of f.eco) {
    chips.push({
      key: `eco-${e}`,
      label: ECOSYSTEMS[e]?.label ?? e,
      clear: () => setF({ eco: f.eco.filter((x) => x !== e) }),
    });
  }
  for (const r of f.role) {
    chips.push({
      key: `role-${r}`,
      label: ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r,
      clear: () => setF({ role: f.role.filter((x) => x !== r) }),
    });
  }
  for (const s of f.seniority) {
    chips.push({
      key: `sen-${s}`,
      label: s,
      clear: () => setF({ seniority: f.seniority.filter((x) => x !== s) }),
    });
  }
  for (const l of f.loc) {
    chips.push({
      key: `loc-${l}`,
      label: LOCATION_OPTIONS.find((o) => o.value === l)?.label ?? l,
      clear: () => setF({ loc: f.loc.filter((x) => x !== l) }),
    });
  }
  if (f.token) {
    chips.push({
      key: "token",
      label: "Token / equity",
      clear: () => setF({ token: null }),
    });
  }
  if (f.min !== SALARY_MIN) {
    chips.push({
      key: "min",
      label: `≥ $${f.min}k`,
      clear: () => setF({ min: null }),
    });
  }
  if (f.max !== SALARY_MAX) {
    chips.push({
      key: "max",
      label: `≤ $${f.max}k`,
      clear: () => setF({ max: null }),
    });
  }
  if (f.posted !== "all") {
    chips.push({
      key: "posted",
      label: `Posted · ${f.posted}`,
      clear: () => setF({ posted: null }),
    });
  }
  if (f.q) {
    chips.push({
      key: "q",
      label: `“${f.q}”`,
      clear: () => setF({ q: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-text-tertiary">Active:</span>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.clear}
          className="flex items-center gap-1.5 rounded-md border border-line bg-glass-hi py-1 pl-2.5 pr-1.5 text-[11.5px] text-text-bright transition-colors hover:border-strong"
        >
          {c.label}
          <X size={11} className="text-text-tertiary" />
        </button>
      ))}
    </div>
  );
}
