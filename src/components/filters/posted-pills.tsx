"use client";

import { useQueryState } from "nuqs";
import { jobsSearchParams, POSTED_VALUES } from "@/lib/jobs-search-params";

const LABEL: Record<string, string> = {
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
  all: "All",
};

/** Segmented control for the `posted` filter (single-select). */
export function PostedPills() {
  const [posted, setPosted] = useQueryState("posted", jobsSearchParams.posted);

  return (
    <div className="flex gap-1">
      {POSTED_VALUES.map((value) => {
        const on = posted === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPosted(value === "all" ? null : value)}
            className={`flex-1 rounded-md border px-2 py-1 text-center font-mono text-[11px] transition-colors ${
              on
                ? "border-strong bg-glass-hi text-text-primary"
                : "border-subtle text-text-secondary hover:text-text-primary"
            }`}
          >
            {LABEL[value]}
          </button>
        );
      })}
    </div>
  );
}
