import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  createLoader,
} from "nuqs/server";

export const POSTED_VALUES = ["24h", "7d", "30d", "all"] as const;
export const SORT_VALUES = ["newest", "fit", "salary"] as const;

/** Compensation bounds, in $thousands. */
export const SALARY_MIN = 120;
export const SALARY_MAX = 400;

/**
 * URL state for /jobs — the single source of truth for filters.
 * `shallow: false` makes every change re-run the RSC query.
 * Imported by both the page (server, via createLoader) and the filter
 * components (client, via useQueryStates).
 */
export const jobsSearchParams = {
  q: parseAsString.withDefault("").withOptions({ shallow: false }),
  eco: parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false }),
  role: parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false }),
  seniority: parseAsArrayOf(parseAsString)
    .withDefault([])
    .withOptions({ shallow: false }),
  loc: parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false }),
  min: parseAsInteger.withDefault(SALARY_MIN).withOptions({ shallow: false }),
  max: parseAsInteger.withDefault(SALARY_MAX).withOptions({ shallow: false }),
  token: parseAsBoolean.withDefault(false).withOptions({ shallow: false }),
  posted: parseAsStringLiteral(POSTED_VALUES)
    .withDefault("all")
    .withOptions({ shallow: false }),
  sort: parseAsStringLiteral(SORT_VALUES)
    .withDefault("newest")
    .withOptions({ shallow: false }),
};

export const loadJobsSearchParams = createLoader(jobsSearchParams);

/** Parsed-filter shape shared between server query and client actions. */
export type JobFilters = {
  q: string;
  eco: string[];
  role: string[];
  seniority: string[];
  loc: string[];
  min: number;
  max: number;
  token: boolean;
  posted: (typeof POSTED_VALUES)[number];
  sort: (typeof SORT_VALUES)[number];
};

/** Maps a `loc` filter value to the seed's remote_scope text. */
export const LOCATION_OPTIONS: { value: string; label: string; scope: string }[] = [
  { value: "remote_worldwide", label: "Remote · Worldwide", scope: "Worldwide" },
  { value: "remote_americas", label: "Remote · Americas", scope: "Americas" },
  { value: "remote_europe", label: "Remote · Europe", scope: "Europe" },
  { value: "remote_emea", label: "Remote · EMEA", scope: "EMEA" },
  { value: "remote_apac", label: "Remote · APAC", scope: "APAC" },
];

/** Role filter — URL-safe slug `value`, display `label`, DB `category`. */
export const ROLE_OPTIONS: { value: string; label: string; category: string }[] = [
  { value: "protocol", label: "Protocol", category: "Protocol" },
  { value: "smart-contracts", label: "Smart Contracts", category: "Smart Contracts" },
  { value: "zk-cryptography", label: "ZK / Cryptography", category: "ZK / Cryptography" },
  { value: "ai-x-crypto", label: "AI x Crypto", category: "AI x Crypto" },
  { value: "frontend", label: "Frontend", category: "Frontend" },
  { value: "infra-devops", label: "Infra / DevOps", category: "Infra / DevOps" },
  { value: "security-audit", label: "Security & Audit", category: "Security & Audit" },
  { value: "devrel", label: "DevRel", category: "DevRel" },
  { value: "research", label: "Research", category: "Research" },
];

export const SENIORITY_LEVELS = ["Junior", "Mid", "Senior", "Staff", "Principal"];

export const ECOSYSTEM_OPTIONS = [
  "evm",
  "sol",
  "btc",
  "zk",
  "base",
  "arb",
  "opt",
  "pol",
  "cos",
  "sui",
  "ai",
];
