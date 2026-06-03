/**
 * Collection taxonomy + copy for the programmatic AEO surface (P16).
 *
 * The 386-job inventory is exposed as keyword-rich landing pages — one per
 * role, one per ecosystem, and one per role×ecosystem combination — so the
 * catalogue becomes hundreds of search- and AI-engine-citeable surfaces.
 * Each page answers a real search intent ("remote Solana smart contract jobs")
 * with live, salary-transparent listings + ItemList JSON-LD.
 *
 * This module is the SINGLE source of truth for which collections exist,
 * how their URLs map to DB filters, and the answer-style intro copy. The
 * pages (`/roles/[role]`, `/ecosystems/[eco]`, `/roles/[role]/[eco]`), the
 * directory hub, the sitemap, and llms.txt all read from here.
 */
import {
  ROLE_OPTIONS,
  ECOSYSTEM_OPTIONS,
  type JobFilters,
} from "@/lib/jobs-search-params";

/* ── role collections ───────────────────────────────────────── */

export type RoleCollection = {
  /** URL slug — matches ROLE_OPTIONS.value, e.g. "smart-contracts". */
  slug: string;
  /** Display label, e.g. "Smart Contracts". */
  label: string;
  /** DB role_category, e.g. "Smart Contracts". */
  category: string;
  /** Lowercase noun phrase for prose, e.g. "smart contract engineering". */
  phrase: string;
};

/** One-line "what this discipline is" blurb, used in the page intro. */
const ROLE_PHRASE: Record<string, string> = {
  protocol: "protocol & consensus engineering",
  "smart-contracts": "smart contract engineering",
  "zk-cryptography": "zero-knowledge & applied cryptography",
  "ai-x-crypto": "AI × crypto engineering",
  frontend: "web3 frontend engineering",
  backend: "crypto backend engineering",
  "infra-devops": "blockchain infrastructure & DevOps",
  "security-audit": "smart contract security & auditing",
  devrel: "developer relations",
  research: "cryptography & protocol research",
};

export const ROLE_COLLECTIONS: RoleCollection[] = ROLE_OPTIONS.map((r) => ({
  slug: r.value,
  label: r.label,
  category: r.category,
  phrase: ROLE_PHRASE[r.value] ?? r.label.toLowerCase(),
}));

export const getRoleCollection = (slug: string): RoleCollection | undefined =>
  ROLE_COLLECTIONS.find((r) => r.slug === slug);

/* ── ecosystem collections ──────────────────────────────────── */

export type EcoCollection = {
  /** URL slug — the full, search-friendly name, e.g. "solana". */
  slug: string;
  /** DB ecosystem key (jobs.ecosystems entries), e.g. "sol". */
  key: string;
  /** Display name, e.g. "Solana". */
  name: string;
  /** Short descriptor for the intro, e.g. "the Solana ecosystem". */
  blurb: string;
};

/**
 * URL slug ↔ DB key. Slugs are the high-search-volume full names; the DB
 * stores short keys (the same keys the eco chips and ATS mapper use).
 */
const ECO_META: Record<string, { slug: string; name: string; blurb: string }> = {
  evm: { slug: "ethereum", name: "Ethereum", blurb: "Ethereum and the EVM" },
  sol: { slug: "solana", name: "Solana", blurb: "the Solana ecosystem" },
  btc: { slug: "bitcoin", name: "Bitcoin", blurb: "Bitcoin and its layers" },
  zk: {
    slug: "zero-knowledge",
    name: "Zero-Knowledge",
    blurb: "zero-knowledge systems",
  },
  base: { slug: "base", name: "Base", blurb: "Base" },
  arb: { slug: "arbitrum", name: "Arbitrum", blurb: "Arbitrum" },
  opt: { slug: "optimism", name: "Optimism", blurb: "Optimism and the OP Stack" },
  pol: { slug: "polygon", name: "Polygon", blurb: "Polygon" },
  cos: { slug: "cosmos", name: "Cosmos", blurb: "the Cosmos ecosystem" },
  sui: { slug: "sui", name: "Sui", blurb: "Sui" },
  ai: { slug: "ai", name: "AI × Crypto", blurb: "the AI × crypto frontier" },
};

export const ECO_COLLECTIONS: EcoCollection[] = ECOSYSTEM_OPTIONS.map((key) => {
  const m = ECO_META[key];
  return { slug: m.slug, key, name: m.name, blurb: m.blurb };
});

export const getEcoCollection = (slug: string): EcoCollection | undefined =>
  ECO_COLLECTIONS.find((e) => e.slug === slug);

export const getEcoByKey = (key: string): EcoCollection | undefined =>
  ECO_COLLECTIONS.find((e) => e.key === key);

/* ── filter builder ─────────────────────────────────────────── */

/**
 * Base filters that match EVERY job (no salary floor, all dates), so a
 * collection shows its full inventory — including roles with undisclosed
 * pay. The /jobs default `min` of 120k would hide those, which is wrong for
 * a "show me all X roles" page.
 */
export function collectionFilters(opts: {
  role?: string;
  eco?: string;
}): JobFilters {
  return {
    q: "",
    company: "",
    eco: opts.eco ? [opts.eco] : [],
    role: opts.role ? [opts.role] : [],
    seniority: [],
    loc: [],
    min: 0,
    max: 1_000_000,
    token: false,
    posted: "all",
    sort: "newest",
  };
}

/* ── in-memory facet distribution ───────────────────────────── */

/** Count jobs per ecosystem key from an already-fetched job set. */
export function ecoCounts(
  jobs: { ecosystems: string[] }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const j of jobs) {
    for (const e of j.ecosystems) out[e] = (out[e] ?? 0) + 1;
  }
  return out;
}

/** Count jobs per role_category from an already-fetched job set. */
export function roleCounts(
  jobs: { roleCategory: string }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const j of jobs) {
    out[j.roleCategory] = (out[j.roleCategory] ?? 0) + 1;
  }
  return out;
}

/* ── intro copy (answer-style, for AEO) ─────────────────────── */

const plural = (n: number, one: string, many = `${one}s`) =>
  n === 1 ? one : many;

/** Lead sentence for a role page — directly answers the search intent. */
export function roleIntro(role: RoleCollection, count: number): string {
  if (count === 0) {
    return `There are no open ${role.phrase} roles in crypto right now. New ${role.label} roles are ingested daily from real ATS feeds — check back, or set an alert below.`;
  }
  return `${count} open ${role.phrase} ${plural(
    count,
    "role",
  )} across the crypto industry, salary-transparent and indexed daily from real company ATS feeds. Every listing below shows compensation, ecosystem, and a direct apply link.`;
}

/** Lead sentence for an ecosystem page. */
export function ecoIntro(eco: EcoCollection, count: number): string {
  if (count === 0) {
    return `No open engineering roles in ${eco.blurb} right now. New ${eco.name} roles are ingested daily from real ATS feeds — check back, or set an alert below.`;
  }
  return `${count} open engineering ${plural(
    count,
    "role",
  )} in ${eco.blurb}, salary-transparent and indexed daily from real company ATS feeds. Browse ${eco.name} smart contract, protocol, infrastructure, and research roles below.`;
}

/** Lead sentence for a role×ecosystem combination page. */
export function comboIntro(
  role: RoleCollection,
  eco: EcoCollection,
  count: number,
): string {
  if (count === 0) {
    return `No open ${role.phrase} roles in ${eco.blurb} right now. These roles are ingested daily from real ATS feeds — check back, or explore related roles below.`;
  }
  return `${count} open ${role.label} ${plural(
    count,
    "role",
  )} in ${eco.blurb}, salary-transparent and indexed daily. Each ${eco.name} ${role.label} role below shows compensation and a direct apply link.`;
}
