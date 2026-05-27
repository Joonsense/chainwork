/**
 * Maps ATS job data (Greenhouse / Lever) to our DB schema shape.
 *
 * Rules:
 *  - Role category: keyword-matched from title + department
 *  - Ecosystems: keyword-scanned across title + description
 *  - Seniority: keyword-matched from title and level field
 *  - Salary: parsed if present in ATS; defaults to 0/0 (→ "Competitive" in UI)
 *  - Slug: {company-slug}-{kebab-title}-{shortId}
 *  - JSON-LD: schema.org/JobPosting minimal structure
 */

import type { GreenhouseJob } from "./greenhouse";
import type { LeverJob } from "./lever";
import type { CompanyEntry } from "./companies";
import type { NewJob, NewCompany } from "@/db/schema";

/* ── helpers ─────────────────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 7);
}

/** Strip HTML tags and collapse whitespace to plain text. */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/?(h[1-6]|div|section|article)[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Convert HTML to minimal Markdown. */
function htmlToMd(html: string): string {
  return html
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "_$1_")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<ul[^>]*>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ol[^>]*>/gi, "\n")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ── Role category inference ────────────────────────────── */

const ROLE_PATTERNS: Array<{
  category: string;
  patterns: RegExp[];
}> = [
  {
    category: "ZK / Cryptography",
    patterns: [
      /\bzk\b|\bzero.?knowledge|\bcircom|\bplonk|\bgroth|\bsnark|\bstark|\bcryptograph/i,
    ],
  },
  {
    category: "Smart Contracts",
    patterns: [/\bsolidity|\bvyper|\bsmart.?contract|\berc.?\d+|\bfoundry|\bhardhat/i],
  },
  {
    category: "Security & Audit",
    patterns: [
      /\bsecurity|\baudit|\bpenetrat|\bvulnerabil|\bctf|\bwhite.?hat|\bbug.?bounty/i,
    ],
  },
  {
    category: "AI x Crypto",
    patterns: [
      /\b(machine.?learning|ml|llm|ai.?agent|artificial.intel|deep.?learning).*crypto|\bcrypto.*(ai|ml)|\bagent/i,
    ],
  },
  {
    category: "Research",
    patterns: [
      /\bresearch(er)?|\bcryptographer|\bprotocol.?research|\beconomist|\bquant\b/i,
    ],
  },
  {
    category: "DevRel",
    patterns: [
      /\bdevrel|\bdeveloper.?relation|\bdeveloper.?advocate|\btechnical.?evangelist|\bdeveloper.?experience/i,
    ],
  },
  {
    category: "Frontend",
    patterns: [
      /\bfrontend|\bfront.end|\breact\b|\bnext.?js|\bvue\b|\bangular\b|\bui.?engineer|\bweb.?developer/i,
    ],
  },
  {
    category: "Infra / DevOps",
    patterns: [
      /\bdevops|\binfrastructure|\bsre\b|\bkubernetes|\bk8s|\bdocker|\bterraform|\bcloud.?engineer|\bplatform.?engineer|\bsite.?reliabil/i,
    ],
  },
  {
    category: "Protocol",
    patterns: [/.*/], // catch-all
  },
];

function inferRoleCategory(title: string, department = ""): string {
  const text = `${title} ${department}`;
  for (const { category, patterns } of ROLE_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return category;
  }
  return "Protocol";
}

/* ── Seniority inference ────────────────────────────────── */

function inferSeniority(title: string, level = ""): string {
  const text = `${title} ${level}`.toLowerCase();
  if (/principal|distinguished|fellow/.test(text)) return "Principal";
  if (/staff|lead\b|tech.?lead/.test(text)) return "Staff";
  if (/senior|sr\.?\b|iii\b/.test(text)) return "Senior";
  if (/junior|jr\.?\b|entry|associate|i\b/.test(text)) return "Junior";
  return "Mid";
}

/* ── Ecosystem detection ────────────────────────────────── */

const ECO_PATTERNS: Array<{ eco: string; patterns: RegExp[] }> = [
  {
    eco: "zk",
    patterns: [/\bzk\b|\bzero.?knowledge|\bstarknet|\bzksync|\bscroll|\bpolygon.?zk|\bplonk|\bsnark/i],
  },
  {
    eco: "solana",
    patterns: [/\bsolana|\bsol\b|\banchor\b|\brust.*(solana|blockchain)|solana.*(rust|program)/i],
  },
  {
    eco: "bitcoin",
    patterns: [/\bbitcoin|\bbtc\b|\blightning|\btaproot|\borginals|\bbrc.?20/i],
  },
  {
    eco: "cosmos",
    patterns: [/\bcosmos|\bibc\b|\btendermint|\bcosmwasm|\bcosmosdk|\bpolaris|\batom\b/i],
  },
  {
    eco: "sui",
    patterns: [/\bsui\b|\bmove.*(lang|vm)|\bmysten/i],
  },
  {
    eco: "optimism",
    patterns: [/\boptimism|\bop.?stack|\bbase\b.*l2|op.?mainnet/i],
  },
  {
    eco: "arbitrum",
    patterns: [/\barbitrum|\bnitro\b|\bstylus\b/i],
  },
  {
    eco: "polygon",
    patterns: [/\bpolygon|\bmatic\b|\bpolygon.?cdk|\bagglayer/i],
  },
  {
    eco: "ai",
    patterns: [/\bai\b|\bmachine.?learn|\bllm\b|\bneural|\bgpt|\bdeep.?learn|\bagent/i],
  },
  {
    eco: "evm",
    patterns: [/\bevm|\bethereum|\bsolidity|\bweb3\.js|\bethers\.js|\bviem\b|\berc.?\d+/i],
  },
];

function detectEcosystems(
  text: string,
  companyEcosystems: string[],
): string[] {
  const found = new Set<string>();
  for (const { eco, patterns } of ECO_PATTERNS) {
    if (patterns.some((p) => p.test(text))) found.add(eco);
  }
  // Always include company's known ecosystems as fallback (max 2)
  for (const eco of companyEcosystems.slice(0, 2)) found.add(eco);
  return Array.from(found);
}

/* ── Skills extraction ──────────────────────────────────── */

const SKILL_KEYWORDS = [
  "Solidity", "Rust", "Go", "Python", "TypeScript", "JavaScript",
  "React", "Next.js", "Node.js", "Foundry", "Hardhat", "Anchor",
  "ZK proofs", "circom", "Halo2", "PLONK", "Groth16",
  "EVM", "Ethereum", "Solana", "Bitcoin", "Cosmos", "Move",
  "Docker", "Kubernetes", "Terraform", "AWS", "GCP", "Azure",
  "GraphQL", "PostgreSQL", "Redis", "Kafka", "gRPC",
  "Cryptography", "DeFi", "NFT", "DAO", "Smart contracts",
  "Formal verification", "Security auditing", "Pentest",
  "Machine learning", "LLM", "PyTorch", "TensorFlow",
];

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter((skill) =>
    lower.includes(skill.toLowerCase()),
  ).slice(0, 15);
}

/* ── Salary parsing ─────────────────────────────────────── */

function parseSalary(text: string): { min: number; max: number } | null {
  // Matches patterns like "$120,000–$200,000" or "$120k–$200k" or "120-200k"
  const patterns = [
    /\$(\d{1,3}(?:,\d{3})*|\d+)[kK]?\s*(?:–|-|to)\s*\$?(\d{1,3}(?:,\d{3})*|\d+)[kK]?/,
    /(\d{2,3})[kK]\s*(?:–|-|to)\s*(\d{2,3})[kK]/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let min = parseInt(m[1].replace(/,/g, ""), 10);
      let max = parseInt(m[2].replace(/,/g, ""), 10);
      // Detect if values are in thousands (e.g. "120k")
      if (min < 1000) min *= 1000;
      if (max < 1000) max *= 1000;
      if (min > 0 && max >= min) return { min, max };
    }
  }
  return null;
}

/* ── Greenhouse mapper ──────────────────────────────────── */

export function mapGreenhouseJob(
  job: GreenhouseJob,
  company: CompanyEntry,
  companyId: string,
): Omit<NewJob, "id" | "createdAt" | "indexedAt"> {
  const department = job.departments?.[0]?.name ?? "";
  const descText = stripHtml(job.content ?? "");
  const descMd = htmlToMd(job.content ?? "");
  const fullText = `${job.title} ${department} ${descText}`;

  const roleCategory = inferRoleCategory(job.title, department);
  const seniority = inferSeniority(job.title);
  const ecosystems = detectEcosystems(fullText, company.ecosystems);
  const skills = extractSkills(fullText);
  const salary = parseSalary(descText);

  const locationName = job.location?.name ?? "Remote";
  const isRemote = /remote/i.test(locationName);
  const remoteScope = isRemote ? "Worldwide" : undefined;
  const location = isRemote ? "Remote" : locationName;

  const jobSlug = `${company.slug}-${slugify(job.title)}-${shortId()}`;

  const postedAt = new Date(job.updated_at ?? Date.now());

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    datePosted: postedAt.toISOString().split("T")[0],
    hiringOrganization: {
      "@type": "Organization",
      name: company.name,
      sameAs: company.website,
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: location },
    },
    employmentType: "FULL_TIME",
    description: descText.slice(0, 500),
    directApply: true,
    url: job.absolute_url,
  };

  return {
    slug: jobSlug,
    companyId,
    title: job.title,
    descriptionMd: descMd || descText || "See the full job posting for details.",
    responsibilities: [],
    requirements: [],
    niceToHave: [],
    oneLiner: descText.slice(0, 120).split(".")[0] ?? job.title,
    roleCategory,
    seniority,
    employmentType: "Full-time",
    location,
    remoteScope: remoteScope ?? null,
    salaryMin: salary?.min ?? 0,
    salaryMax: salary?.max ?? 0,
    salaryCurrency: "USD",
    hasTokenEquity: false,
    ecosystems,
    skills,
    isFeatured: false,
    featuredUntil: null,
    isSponsored: false,
    isVerified: false,
    applyUrl: job.absolute_url,
    applyEmail: null,
    applyCount: 0,
    postedBy: null,
    jsonLd,
    postedAt,
    source: "greenhouse",
    externalId: String(job.id),
    viewCount: 0,
  };
}

/* ── Lever mapper ───────────────────────────────────────── */

export function mapLeverJob(
  job: LeverJob,
  company: CompanyEntry,
  companyId: string,
): Omit<NewJob, "id" | "createdAt" | "indexedAt"> {
  const department = job.categories?.department ?? "";
  const level = job.categories?.level ?? "";
  const commitment = job.categories?.commitment ?? "Full-time";

  const descText = job.descriptionPlain || stripHtml(job.description ?? "");
  const listsMd = job.lists
    .map((l) => `## ${l.text}\n${htmlToMd(l.content)}`)
    .join("\n\n");
  const descMd = htmlToMd(job.description ?? "") + (listsMd ? "\n\n" + listsMd : "");
  const additionalMd = htmlToMd(job.additional ?? "");
  const fullMd = descMd + (additionalMd ? "\n\n" + additionalMd : "");

  const fullText = `${job.text} ${department} ${level} ${descText} ${job.lists.map((l) => l.text).join(" ")}`;

  const roleCategory = inferRoleCategory(job.text, department);
  const seniority = inferSeniority(job.text, level);
  const ecosystems = detectEcosystems(fullText, company.ecosystems);
  const skills = extractSkills(fullText);
  const salary = parseSalary(descText);

  const locationRaw = job.categories?.location ?? "Remote";
  const isRemote = /remote/i.test(locationRaw);
  const remoteScope = isRemote ? "Worldwide" : undefined;
  const location = isRemote ? "Remote" : locationRaw;

  const employmentType =
    /contract/i.test(commitment) ? "Contract" : "Full-time";

  const jobSlug = `${company.slug}-${slugify(job.text)}-${shortId()}`;
  const postedAt = new Date(job.createdAt);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.text,
    datePosted: postedAt.toISOString().split("T")[0],
    hiringOrganization: {
      "@type": "Organization",
      name: company.name,
      sameAs: company.website,
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: location },
    },
    employmentType: employmentType === "Full-time" ? "FULL_TIME" : "CONTRACTOR",
    description: descText.slice(0, 500),
    directApply: true,
    url: job.hostedUrl,
  };

  return {
    slug: jobSlug,
    companyId,
    title: job.text,
    descriptionMd: fullMd || descText || "See the full job posting for details.",
    responsibilities: [],
    requirements: [],
    niceToHave: [],
    oneLiner: descText.slice(0, 120).split(".")[0] ?? job.text,
    roleCategory,
    seniority,
    employmentType,
    location,
    remoteScope: remoteScope ?? null,
    salaryMin: salary?.min ?? 0,
    salaryMax: salary?.max ?? 0,
    salaryCurrency: "USD",
    hasTokenEquity: false,
    ecosystems,
    skills,
    isFeatured: false,
    featuredUntil: null,
    isSponsored: false,
    isVerified: false,
    applyUrl: job.hostedUrl ?? job.applyUrl,
    applyEmail: null,
    applyCount: 0,
    postedBy: null,
    jsonLd,
    postedAt,
    source: "lever",
    externalId: job.id,
    viewCount: 0,
  };
}

/* ── Company mapper ─────────────────────────────────────── */

export function mapCompany(entry: CompanyEntry): Omit<NewCompany, "id" | "createdAt"> {
  return {
    slug: entry.slug,
    name: entry.name,
    logoText: entry.logoText,
    logoBg: entry.logoBg,
    logoFg: entry.logoFg,
    stage: entry.stage ?? null,
    size: null,
    focus: entry.focus ?? null,
    hq: entry.hq ?? "Remote-first",
    ecosystems: entry.ecosystems,
    website: entry.website,
    verified: false,
  };
}
