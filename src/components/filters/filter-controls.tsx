"use client";

import { useQueryState, useQueryStates } from "nuqs";
import { jobsSearchParams, SALARY_MIN, SALARY_MAX } from "@/lib/jobs-search-params";

/* Small URL-bound controls: token toggle, sort, reset, plus a static
   placeholder toggle. */

function Switch({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="flex w-full items-center justify-between py-1.5 text-[12.5px] text-text-secondary transition-colors hover:text-text-primary disabled:cursor-default disabled:opacity-45 disabled:hover:text-text-secondary"
    >
      <span>{label}</span>
      <span
        className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors ${
          on ? "bg-gradient-brand" : "bg-surface-3"
        }`}
      >
        <span
          className={`absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white transition-all ${
            on ? "left-[14px]" : "left-[2px]"
          }`}
        />
      </span>
    </button>
  );
}

export function TokenToggle() {
  const [token, setToken] = useQueryState("token", jobsSearchParams.token);
  return (
    <Switch
      on={!!token}
      onClick={() => setToken(token ? null : true)}
      label="Token / equity included"
    />
  );
}

/** Visual-only toggle — all seeded roles disclose salary (wired in a later phase). */
export function PlaceholderToggle({ label }: { label: string }) {
  return <Switch on={false} label={label} />;
}

function countActiveGroups(f: {
  q: string;
  eco: string[];
  role: string[];
  seniority: string[];
  loc: string[];
  token: boolean;
  posted: string;
  min: number;
  max: number;
}): number {
  return (
    (f.eco.length ? 1 : 0) +
    (f.role.length ? 1 : 0) +
    (f.seniority.length ? 1 : 0) +
    (f.loc.length ? 1 : 0) +
    (f.token ? 1 : 0) +
    (f.posted !== "all" ? 1 : 0) +
    (f.q ? 1 : 0) +
    (f.min !== SALARY_MIN || f.max !== SALARY_MAX ? 1 : 0)
  );
}

export function FilterReset() {
  const [f, setF] = useQueryStates(jobsSearchParams);
  const active = countActiveGroups(f);

  return (
    <button
      type="button"
      disabled={active === 0}
      onClick={() =>
        setF({
          q: null,
          eco: null,
          role: null,
          seniority: null,
          loc: null,
          min: null,
          max: null,
          token: null,
          posted: null,
        })
      }
      className="font-mono text-[11px] text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-40 disabled:hover:text-text-tertiary"
    >
      Reset{active > 0 ? ` · ${active}` : ""}
    </button>
  );
}

export function SortControl({
  matchAvailable = false,
}: {
  matchAvailable?: boolean;
}) {
  const [sort, setSort] = useQueryState("sort", jobsSearchParams.sort);
  const options = [
    { value: "newest" as const, label: "Newest" },
    { value: "salary" as const, label: "Salary" },
    // "Fit" only when the user is signed in with an indexed profile.
    ...(matchAvailable ? [{ value: "fit" as const, label: "Fit" }] : []),
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-subtle bg-glass p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setSort(o.value === "newest" ? null : o.value)}
          className={`rounded-md px-2.5 py-1 text-[12px] transition-colors ${
            sort === o.value
              ? "bg-glass-hi text-text-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
