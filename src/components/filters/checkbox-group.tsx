"use client";

import { useQueryState } from "nuqs";
import { Check } from "lucide-react";
import { EcoBadge } from "@/components/ui/eco-badge";
import { jobsSearchParams } from "@/lib/jobs-search-params";

type Option = { value: string; label: string; count: number; eco?: string };

/**
 * Multi-select filter group bound to a `string[]` URL param. Each option
 * shows a faceted count — how many results remain if it is selected.
 */
export function CheckboxGroup({
  paramKey,
  options,
}: {
  paramKey: "eco" | "role" | "seniority" | "loc";
  options: Option[];
}) {
  const [selected, setSelected] = useQueryState(
    paramKey,
    jobsSearchParams[paramKey],
  );

  function toggle(value: string) {
    setSelected(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  return (
    <div className="flex flex-col">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className="flex items-center justify-between gap-2 py-[5px] text-left text-[12.5px] text-text-secondary transition-colors hover:text-text-primary"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
                  on ? "border-transparent bg-gradient-brand" : "border-strong"
                }`}
              >
                {on && (
                  <Check size={9} strokeWidth={3} className="text-white" />
                )}
              </span>
              {o.eco && <EcoBadge ecosystem={o.eco} />}
              <span className="truncate">{o.label}</span>
            </span>
            <span className="font-mono text-[10.5px] text-text-muted">
              {o.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
