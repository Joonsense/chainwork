import "dotenv/config";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db, companies, jobs } from "./index";
import type { NewCompany, NewJob } from "./schema";

/**
 * Seed — 20 companies, 50 jobs.
 *
 * Idempotent: truncates every table, then inserts. Re-running produces the
 * same data (no duplicates). Company names are invented, not real. Job
 * content is generated from role archetypes so each listing reads like a
 * genuine web3 posting. json_ld is precomputed here and stored on the row.
 */

/* ── 20 invented companies ──────────────────────────────────── */
type CompanySpec = Omit<NewCompany, "id" | "createdAt"> & { ecos: string[] };

const COMPANY_SPECS: CompanySpec[] = [
  { slug: "helix-labs", name: "Helix Labs", logoText: "HL", logoBg: "#0a0a0a", logoFg: "#fafaf7", stage: "Series B", size: "60–120", focus: "zkEVM rollup infrastructure", website: "https://helix-labs.xyz", verified: true, ecos: ["evm", "zk", "opt"] },
  { slug: "onchain-ai", name: "Onchain AI", logoText: "OA", logoBg: "oklch(0.42 0.13 155)", logoFg: "#fafaf7", stage: "Seed", size: "8–15", focus: "autonomous onchain agents", website: "https://onchain-ai.xyz", verified: true, ecos: ["ai", "evm", "base"] },
  { slug: "lattice", name: "Lattice", logoText: "LT", logoBg: "#1e69ff", logoFg: "#fafaf7", stage: "Series A", size: "25–40", focus: "ZK research and zkVMs", website: "https://lattice.xyz", verified: true, ecos: ["zk", "evm"] },
  { slug: "modular", name: "Modular", logoText: "MD", logoBg: "#0052ff", logoFg: "#fafaf7", stage: "Series A", size: "40–60", focus: "modular DeFi primitives", website: "https://modular.xyz", verified: true, ecos: ["evm", "base", "arb"] },
  { slug: "stride", name: "Stride", logoText: "SR", logoBg: "#9945ff", logoFg: "#fafaf7", stage: "Seed", size: "12–20", focus: "Solana validator infrastructure", website: "https://stride.xyz", verified: true, ecos: ["sol"] },
  { slug: "forge", name: "Forge", logoText: "FG", logoBg: "#171717", logoFg: "#fafaf7", stage: "Bootstrapped", size: "6–12", focus: "smart contract security and audits", website: "https://forge.xyz", verified: false, ecos: ["evm", "opt", "arb"] },
  { slug: "mesh", name: "Mesh", logoText: "MS", logoBg: "#28a0f0", logoFg: "#fafaf7", stage: "Series A", size: "30–50", focus: "cross-rollup interoperability", website: "https://mesh.xyz", verified: true, ecos: ["arb", "evm", "opt"] },
  { slug: "helios", name: "Helios", logoText: "HE", logoBg: "#f7931a", logoFg: "#0a0a0a", stage: "Series B", size: "50–90", focus: "Bitcoin L2 and Lightning", website: "https://helios.xyz", verified: true, ecos: ["btc"] },
  { slug: "atlas", name: "Atlas", logoText: "AT", logoBg: "#4da2ff", logoFg: "#0a0a0a", stage: "Seed", size: "10–18", focus: "Move-based DeFi on Sui", website: "https://atlas.xyz", verified: false, ecos: ["sui"] },
  { slug: "beam", name: "Beam", logoText: "BM", logoBg: "#6f41d8", logoFg: "#fafaf7", stage: "Series A", size: "20–35", focus: "onchain AI developer tooling", website: "https://beam.xyz", verified: false, ecos: ["ai", "evm"] },
  { slug: "cosmoship", name: "Cosmoship", logoText: "CS", logoBg: "#2e3148", logoFg: "#fafaf7", stage: "Seed", size: "9–16", focus: "Cosmos IBC infrastructure", website: "https://cosmoship.xyz", verified: false, ecos: ["cos"] },
  { slug: "nimbus", name: "Nimbus", logoText: "NB", logoBg: "#06b6d4", logoFg: "#0a0a0a", stage: "Series A", size: "24–42", focus: "decentralized GPU compute", website: "https://nimbus.xyz", verified: true, ecos: ["ai", "evm"] },
  { slug: "vertex", name: "Vertex", logoText: "VX", logoBg: "#ef4444", logoFg: "#fafaf7", stage: "Series A", size: "35–55", focus: "an onchain perpetuals exchange", website: "https://vertex.xyz", verified: true, ecos: ["arb", "evm"] },
  { slug: "quanta", name: "Quanta", logoText: "QT", logoBg: "#8b5cf6", logoFg: "#fafaf7", stage: "Seed", size: "7–14", focus: "ZK identity and proofs", website: "https://quanta.xyz", verified: false, ecos: ["zk", "evm"] },
  { slug: "halcyon", name: "Halcyon", logoText: "HC", logoBg: "#14b8a6", logoFg: "#0a0a0a", stage: "Series A", size: "22–38", focus: "restaking and shared security", website: "https://halcyon.xyz", verified: true, ecos: ["evm", "zk"] },
  { slug: "prism", name: "Prism", logoText: "PR", logoBg: "#f59e0b", logoFg: "#0a0a0a", stage: "Seed", size: "8–15", focus: "onchain data and analytics", website: "https://prism.xyz", verified: false, ecos: ["evm", "sol", "base"] },
  { slug: "aperture", name: "Aperture", logoText: "AP", logoBg: "#0a0a0a", logoFg: "#fafaf7", stage: "Series B", size: "70–110", focus: "institutional DeFi infrastructure", website: "https://aperture.xyz", verified: true, ecos: ["evm", "base"] },
  { slug: "cipher", name: "Cipher", logoText: "CP", logoBg: "#475569", logoFg: "#fafaf7", stage: "Bootstrapped", size: "5–10", focus: "wallet security and MPC", website: "https://cipher.xyz", verified: false, ecos: ["evm", "sol"] },
  { slug: "relay", name: "Relay", logoText: "RL", logoBg: "#ec4899", logoFg: "#fafaf7", stage: "Seed", size: "11–19", focus: "account abstraction and onchain UX", website: "https://relay.xyz", verified: false, ecos: ["base", "evm"] },
  { slug: "quorum", name: "Quorum", logoText: "QM", logoBg: "#3b82f6", logoFg: "#fafaf7", stage: "Series A", size: "28–46", focus: "onchain governance tooling", website: "https://quorum.xyz", verified: true, ecos: ["evm", "pol"] },
];

/* ── role archetypes — 18, two per category (9 categories) ───── */
type Archetype = {
  category: string;
  base: string;
  noPrefix?: boolean;
  skills: string[];
  hook: string;
  context: string;
  responsibilities: string[];
  /** {years} is substituted with the seniority's experience band */
  requirements: string[];
};

const ARCHETYPES: Archetype[] = [
  {
    category: "Protocol",
    base: "Protocol Engineer",
    skills: ["Rust", "Go", "Consensus", "P2P networking"],
    hook: "Own core protocol development — from the consensus client to the networking stack that keeps the chain live.",
    context: "This is deep systems work: you sit in the critical path of every block produced.",
    responsibilities: [
      "Design and ship consensus-layer changes in Rust",
      "Improve block propagation and p2p networking throughput",
      "Write rigorous specs and shepherd them from testnet to mainnet",
      "Debug live network incidents and lead the post-mortems",
    ],
    requirements: [
      "{years} building distributed systems or blockchain protocols",
      "Strong Rust or Go, with a feel for low-level performance",
      "Experience with consensus (BFT, PoS) or p2p networking",
      "Comfort working in an open-source, spec-driven codebase",
    ],
  },
  {
    category: "Protocol",
    base: "Consensus Engineer",
    skills: ["Rust", "BFT", "Distributed systems", "Networking"],
    hook: "Push the limits of finality and throughput on a chain that thousands of validators depend on.",
    context: "You co-own the consensus roadmap and the safety guarantees underneath it.",
    responsibilities: [
      "Implement and optimize BFT consensus in Rust",
      "Model safety and liveness under adversarial conditions",
      "Cut block times without weakening finality guarantees",
      "Partner with infra on validator rollout and upgrades",
    ],
    requirements: [
      "{years} in distributed systems, ideally consensus-critical code",
      "Deep Rust expertise and a strong correctness mindset",
      "Familiarity with BFT-family protocols and their failure modes",
      "A track record shipping protocol upgrades to a live network",
    ],
  },
  {
    category: "Smart Contracts",
    base: "Solidity Engineer",
    skills: ["Solidity", "Foundry", "EVM", "DeFi"],
    hook: "Design and ship the smart contracts at the center of the protocol — money-moving code, held to the highest bar.",
    context: "Every line you write is adversarially tested and immutable once deployed.",
    responsibilities: [
      "Architect and implement Solidity contracts with Foundry",
      "Write exhaustive test suites, invariants, and fuzz harnesses",
      "Drive gas optimization across the contract surface",
      "Coordinate audits and own the deployment runbook",
    ],
    requirements: [
      "{years} writing production Solidity deployed to mainnet",
      "Fluency with Foundry, the EVM, and common DeFi primitives",
      "A security-first instinct — you think in exploits, not happy paths",
      "Experience coordinating external audits end to end",
    ],
  },
  {
    category: "Smart Contracts",
    base: "Smart Contract Engineer, DeFi",
    skills: ["Solidity", "AMM design", "Foundry", "Mechanism design"],
    hook: "Build the DeFi primitives — AMMs, lending markets, perps — the next wave of onchain finance runs on.",
    context: "You own a product surface end to end, from mechanism design to mainnet.",
    responsibilities: [
      "Implement DeFi mechanisms in Solidity with strong invariants",
      "Model economic attack surfaces and edge-case behavior",
      "Optimize for gas without ever compromising safety",
      "Ship upgrades behind timelocks and governance",
    ],
    requirements: [
      "{years} of Solidity, with shipped DeFi protocols behind you",
      "Deep understanding of AMM, lending, and perp mechanics",
      "Comfort reasoning about economic and MEV attack vectors",
      "A Foundry-first testing discipline",
    ],
  },
  {
    category: "ZK / Cryptography",
    base: "ZK Cryptographer",
    skills: ["Halo2", "Plonky3", "Rust", "SNARKs"],
    hook: "Push the frontier of recursive proofs and zkVMs — open-source first, shipped to mainnet.",
    context: "You turn cutting-edge proving research into code that runs in production.",
    responsibilities: [
      "Implement proving systems and circuits in Rust",
      "Cut proving time and memory across the prover stack",
      "Translate cryptography papers into audited production code",
      "Contribute upstream to the ZK open-source ecosystem",
    ],
    requirements: [
      "{years} in applied cryptography or ZK engineering",
      "Hands-on with Halo2, Plonky3, or comparable proving stacks",
      "Strong Rust and a solid grasp of SNARK/STARK internals",
      "The ability to read and implement directly from papers",
    ],
  },
  {
    category: "ZK / Cryptography",
    base: "Cryptography Engineer",
    skills: ["Rust", "Proving systems", "Elliptic curves", "Protocols"],
    hook: "Engineer the cryptographic core — the proving and verification paths everything else trusts.",
    context: "Correctness here is non-negotiable; this code is the root of trust.",
    responsibilities: [
      "Build and harden cryptographic primitives in Rust",
      "Profile and optimize hot paths in the proving pipeline",
      "Specify protocols precisely and get them reviewed",
      "Collaborate with auditors on the cryptographic surface",
    ],
    requirements: [
      "{years} of cryptography or security-critical engineering",
      "Comfort with elliptic curves, hashing, and commitment schemes",
      "Production Rust and a rigorous correctness mindset",
      "Experience shipping cryptographic code that has been audited",
    ],
  },
  {
    category: "AI x Crypto",
    base: "AI x Crypto Research Engineer",
    skills: ["PyTorch", "Agents", "Solidity", "LLMs"],
    hook: "Build autonomous agents that operate fully onchain — trading, governing, and coordinating without a human in the loop.",
    context: "This is greenfield work at the seam of two fast-moving fields.",
    responsibilities: [
      "Prototype and ship onchain AI agents across L2s",
      "Connect LLM reasoning to onchain execution, safely",
      "Design evals for agent reliability and economic safety",
      "Publish findings and open-source reference implementations",
    ],
    requirements: [
      "{years} across ML and crypto, or deep expertise in one",
      "Hands-on with PyTorch, LLMs, and agent frameworks",
      "Working knowledge of Solidity and onchain execution",
      "Comfort in ambiguous, research-heavy problem spaces",
    ],
  },
  {
    category: "AI x Crypto",
    base: "ML Infrastructure Engineer",
    skills: ["GPU", "Triton", "Kubernetes", "Inference"],
    hook: "Own the inference infrastructure — the GPU fleet and serving stack that keeps onchain AI fast and cheap.",
    context: "You are the difference between a demo and a system that scales.",
    responsibilities: [
      "Build and operate low-latency model-serving infrastructure",
      "Optimize GPU utilization and inference cost",
      "Run the Kubernetes platform hosting the workloads",
      "Instrument everything — latency, throughput, spend",
    ],
    requirements: [
      "{years} in ML infrastructure or platform engineering",
      "Hands-on GPU scheduling, Triton, or similar serving stacks",
      "Strong Kubernetes and observability fundamentals",
      "A bias for measuring before optimizing",
    ],
  },
  {
    category: "Frontend",
    base: "Frontend Engineer",
    skills: ["TypeScript", "React", "viem", "Next.js"],
    hook: "Build the interface to the protocol — fast, legible, and trustworthy enough to move real money through.",
    context: "Onchain UX is hard; your job is to make it feel effortless.",
    responsibilities: [
      "Build product surfaces in TypeScript, React, and Next.js",
      "Integrate wallets and onchain data with viem and wagmi",
      "Obsess over latency, loading states, and transaction clarity",
      "Partner with design on a high-craft component system",
    ],
    requirements: [
      "{years} building production React applications",
      "Fluency with TypeScript and modern Next.js",
      "Experience wiring up onchain data and wallet flows",
      "A strong eye for craft, motion, and detail",
    ],
  },
  {
    category: "Frontend",
    base: "Founding Frontend Engineer",
    noPrefix: true,
    skills: ["Next.js", "wagmi", "TypeScript", "Design systems"],
    hook: "Set the frontend foundations — own the stack, the patterns, and the bar for everything built after you.",
    context: "You will have unusual scope and the autonomy to use it.",
    responsibilities: [
      "Establish the frontend architecture and component system",
      "Ship the first user-facing product surfaces end to end",
      "Wire onchain data and wallet UX with wagmi and viem",
      "Set the craft bar and help hire the team behind you",
    ],
    requirements: [
      "{years} of frontend, including time as an early engineer",
      "Deep Next.js, TypeScript, and design-system experience",
      "Onchain frontend experience — wallets, signing, indexing",
      "Comfort owning ambiguity and making fast, sound calls",
    ],
  },
  {
    category: "Infra / DevOps",
    base: "Infrastructure Engineer",
    skills: ["Rust", "Kubernetes", "Observability", "Terraform"],
    hook: "Own the infrastructure that keeps the network online — nodes, pipelines, and the observability around them.",
    context: "When the chain has to stay up, this is the team that keeps it up.",
    responsibilities: [
      "Operate node and validator infrastructure at scale",
      "Build CI/CD and infrastructure-as-code with Terraform",
      "Make the system observable — metrics, traces, alerts",
      "Lead incident response and harden against the next one",
    ],
    requirements: [
      "{years} in infrastructure, platform, or SRE roles",
      "Strong Kubernetes, Terraform, and Linux fundamentals",
      "Comfort operating blockchain nodes or similar stateful systems",
      "Calm, methodical incident-response instincts",
    ],
  },
  {
    category: "Infra / DevOps",
    base: "Site Reliability Engineer",
    skills: ["Kubernetes", "Go", "Observability", "Incident response"],
    hook: "Keep validators and RPC infrastructure fast and available — define what reliable means here, then enforce it.",
    context: "You set the SLOs and build the systems that hold them.",
    responsibilities: [
      "Define and defend SLOs for validator and RPC services",
      "Automate away toil with Go and solid tooling",
      "Build dashboards and alerting that catch issues early",
      "Run blameless post-mortems and close the loop",
    ],
    requirements: [
      "{years} of SRE or production operations experience",
      "Strong Kubernetes plus scripting in Go or Python",
      "Experience running latency-sensitive, stateful services",
      "A measurement-driven, automation-first mindset",
    ],
  },
  {
    category: "Security & Audit",
    base: "Smart Contract Auditor",
    skills: ["Solidity", "Fuzzing", "Foundry", "Security"],
    hook: "Break smart contracts before attackers do — review, fuzz, and harden the code that guards real value.",
    context: "Your sign-off is the last line before mainnet.",
    responsibilities: [
      "Audit Solidity contracts for economic and technical exploits",
      "Build fuzzing and invariant suites that find real bugs",
      "Write clear findings with concrete, prioritized fixes",
      "Partner with engineering to close gaps for good",
    ],
    requirements: [
      "{years} auditing or attacking smart contracts",
      "Deep Solidity, EVM, and DeFi exploit knowledge",
      "Hands-on with Foundry fuzzing, Echidna, or similar",
      "A relentless, adversarial reading of every line",
    ],
  },
  {
    category: "Security & Audit",
    base: "Security Engineer",
    skills: ["Protocol security", "Rust", "Threat modeling", "Incident response"],
    hook: "Own protocol security end to end — threat modeling, hardening, and the response when something goes wrong.",
    context: "You make security a property of how the team builds, not an afterthought.",
    responsibilities: [
      "Threat-model new protocol features before they ship",
      "Build security tooling and review the highest-risk code",
      "Run a responsible-disclosure and bug-bounty program",
      "Lead incident response and drive durable fixes",
    ],
    requirements: [
      "{years} in security engineering, ideally onchain",
      "A strong grasp of protocol and smart-contract attack surfaces",
      "Hands-on Rust or Solidity for review and tooling",
      "Clear communication under pressure",
    ],
  },
  {
    category: "DevRel",
    base: "Developer Relations Engineer",
    skills: ["TypeScript", "SDKs", "Technical writing", "Docs"],
    hook: "Be the bridge between the protocol and the developers building on it — through SDKs, docs, and real code.",
    context: "You ship developer experience, you do not just talk about it.",
    responsibilities: [
      "Build and maintain SDKs, examples, and starter kits",
      "Write documentation and tutorials developers actually finish",
      "Turn developer feedback into product and DX improvements",
      "Support builders in Discord, GitHub, and at hackathons",
    ],
    requirements: [
      "{years} as an engineer who loves teaching and writing",
      "Strong TypeScript and the ability to ship real sample code",
      "Excellent technical writing and communication",
      "Genuine empathy for the developer experience",
    ],
  },
  {
    category: "DevRel",
    base: "Developer Advocate",
    skills: ["Public speaking", "TypeScript", "Content", "Community"],
    hook: "Grow the developer community — through talks, content, and showing up where builders actually are.",
    context: "You are a credible engineer first and a communicator second.",
    responsibilities: [
      "Create technical content — posts, videos, demos, and talks",
      "Represent the protocol at conferences and hackathons",
      "Channel community signal back into the product roadmap",
      "Grow and nurture the developer community",
    ],
    requirements: [
      "{years} in developer-facing engineering or advocacy",
      "Comfortable on stage and strong on the page",
      "Enough hands-on coding to earn developer trust",
      "A real network in the crypto or AI developer community",
    ],
  },
  {
    category: "Research",
    base: "Protocol Researcher",
    skills: ["Mechanism design", "Cryptoeconomics", "Game theory", "Modeling"],
    hook: "Research the mechanisms and incentives at the heart of the protocol — then turn that research into shipped design.",
    context: "Your work decides what the engineering team builds next.",
    responsibilities: [
      "Design and analyze protocol mechanisms and incentives",
      "Model economic and game-theoretic attack surfaces",
      "Write specs and research notes that guide implementation",
      "Partner with engineering to land research in production",
    ],
    requirements: [
      "{years} in protocol research, cryptoeconomics, or a related field",
      "Strong mechanism design and game-theory fundamentals",
      "The ability to model systems and communicate findings crisply",
      "A bridge-builder between research and engineering",
    ],
  },
  {
    category: "Research",
    base: "Research Scientist, Cryptography",
    noPrefix: true,
    skills: ["Cryptography", "Proving systems", "Papers", "Rust"],
    hook: "Do original cryptography research — and see it shipped, not shelved.",
    context: "You publish, prototype, and hand off to engineering for production.",
    responsibilities: [
      "Research new proving systems and cryptographic protocols",
      "Prototype results and validate them against real workloads",
      "Publish papers and contribute to open standards",
      "Partner with engineers to productionize what works",
    ],
    requirements: [
      "{years} in cryptography research, or a PhD plus practice",
      "Depth in proving systems, lattices, or related areas",
      "Strong enough Rust to prototype your own ideas",
      "A track record of research that actually shipped",
    ],
  },
];

/* ── distribution constants ─────────────────────────────────── */
const SENIORITIES = ["Junior", "Mid", "Senior", "Staff", "Principal"] as const;
const SENIORITY_PREFIX: Record<string, string> = {
  Junior: "Junior",
  Mid: "",
  Senior: "Senior",
  Staff: "Staff",
  Principal: "Principal",
};
const SENIORITY_YEARS: Record<string, string> = {
  Junior: "1+ years",
  Mid: "3+ years",
  Senior: "5+ years",
  Staff: "8+ years",
  Principal: "10+ years",
};
const SALARY_BANDS: Record<string, { minLo: number; minHi: number; maxLo: number; maxHi: number }> = {
  Junior: { minLo: 120, minHi: 140, maxLo: 150, maxHi: 175 },
  Mid: { minLo: 150, minHi: 175, maxLo: 195, maxHi: 225 },
  Senior: { minLo: 185, minHi: 215, maxLo: 250, maxHi: 290 },
  Staff: { minLo: 235, minHi: 275, maxLo: 305, maxHi: 350 },
  Principal: { minLo: 285, minHi: 330, maxLo: 360, maxHi: 400 },
};
const REMOTE_SCOPES = ["Worldwide", "Americas", "Europe", "APAC", "EMEA"];
const FEATURED_INDICES = new Set([2, 3, 4, 7, 12, 14]); // 6 featured
const SPONSORED_INDEX = 11; // 1 sponsored
const TOTAL_JOBS = 50;

/* ── helpers ────────────────────────────────────────────────── */
const kebab = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const round5 = (n: number) => Math.round(n / 5) * 5;

function buildJsonLd(
  job: NewJob,
  company: CompanySpec & { id: string },
): Record<string, unknown> {
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.descriptionMd,
    datePosted: (job.postedAt as Date).toISOString(),
    validThrough: new Date(
      (job.postedAt as Date).getTime() + 30 * 86_400_000,
    ).toISOString(),
    employmentType: job.employmentType === "Contract" ? "CONTRACTOR" : "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: company.name,
      sameAs: company.website,
    },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: {
      "@type": "Country",
      name: job.remoteScope ?? "Worldwide",
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency,
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: "YEAR",
      },
    },
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: "Chainwork",
      value: job.slug,
    },
  };
}

/* ── job generation ─────────────────────────────────────────── */
function generateJobs(
  companyRows: (CompanySpec & { id: string })[],
): NewJob[] {
  const now = Date.now();
  const slugs = new Set<string>();
  const rows: NewJob[] = [];

  for (let i = 0; i < TOTAL_JOBS; i++) {
    const arch = ARCHETYPES[i % ARCHETYPES.length];
    const company = companyRows[i % companyRows.length];
    const seniority = SENIORITIES[i % SENIORITIES.length];
    const years = SENIORITY_YEARS[seniority];
    const prefix = SENIORITY_PREFIX[seniority];

    const title = arch.noPrefix || !prefix ? arch.base : `${prefix} ${arch.base}`;

    let slug = `${kebab(title)}-${company.slug}`;
    if (slugs.has(slug)) slug = `${slug}-${i}`;
    slugs.add(slug);

    const band = SALARY_BANDS[seniority];
    const salaryMin = round5(band.minLo + ((i * 13) % (band.minHi - band.minLo + 1))) * 1000;
    const salaryMax = round5(band.maxLo + ((i * 17) % (band.maxHi - band.maxLo + 1))) * 1000;

    const employmentType = i % 11 === 5 ? "Contract" : "Full-time";
    const hasTokenEquity = i % 3 !== 0;
    const remoteScope = REMOTE_SCOPES[i % REMOTE_SCOPES.length];
    const location = `Remote — ${remoteScope}`;

    // half within the last 24h, half 1–30 days ago
    const postedAt =
      i % 2 === 0
        ? new Date(now - ((i * 53) % 24) * 3_600_000 - ((i * 7) % 60) * 60_000)
        : new Date(now - (1 + ((i * 3) % 29)) * 86_400_000);

    const stageClause = `a ${company.size}-person ${
      company.stage === "Bootstrapped" ? "bootstrapped" : company.stage
    } team`;
    const descriptionMd =
      `${arch.hook}\n\n` +
      `${company.name} is ${stageClause} building ${company.focus}. ` +
      `${arch.context} The role is fully remote (${remoteScope}); salary is ` +
      `transparent and listed up front` +
      `${hasTokenEquity ? ", and includes token or equity upside" : ""}.`;

    const requirements = arch.requirements.map((r) => r.replace("{years}", years));

    const row: NewJob = {
      id: randomUUID(),
      slug,
      companyId: company.id,
      title,
      descriptionMd,
      responsibilities: arch.responsibilities,
      requirements,
      roleCategory: arch.category,
      seniority,
      employmentType,
      location,
      remoteScope,
      salaryMin,
      salaryMax,
      salaryCurrency: "USD",
      hasTokenEquity,
      ecosystems: company.ecos,
      skills: arch.skills,
      isFeatured: FEATURED_INDICES.has(i),
      isSponsored: i === SPONSORED_INDEX,
      isVerified: company.verified,
      applyUrl: `/apply/${slug}`,
      jsonLd: {}, // filled below
      postedAt,
      indexedAt: new Date(now - ((i * 19) % 50) * 1000),
    };
    row.jsonLd = buildJsonLd(row, company);
    rows.push(row);
  }

  return rows;
}

/* ── main ───────────────────────────────────────────────────── */
async function main() {
  console.log("⛓  Seeding chainwork …");

  // Idempotent: clear everything first.
  await db.execute(
    sql`TRUNCATE TABLE saved_jobs, job_alerts, candidate_profiles, jobs, companies RESTART IDENTITY CASCADE`,
  );
  console.log("   · truncated all tables");

  const companyRows = COMPANY_SPECS.map((c) => ({ ...c, id: randomUUID() }));
  const companyInsert: NewCompany[] = companyRows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    logoText: c.logoText,
    logoBg: c.logoBg,
    logoFg: c.logoFg,
    stage: c.stage,
    size: c.size,
    focus: c.focus,
    website: c.website,
    verified: c.verified,
  }));
  await db.insert(companies).values(companyInsert);
  console.log(`   · inserted ${companyRows.length} companies`);

  const jobRows = generateJobs(companyRows);
  await db.insert(jobs).values(jobRows);
  console.log(`   · inserted ${jobRows.length} jobs`);

  const featured = jobRows.filter((j) => j.isFeatured).length;
  const sponsored = jobRows.filter((j) => j.isSponsored).length;
  const categories = new Set(jobRows.map((j) => j.roleCategory)).size;
  const seniorities = new Set(jobRows.map((j) => j.seniority)).size;
  const ecosystems = new Set(jobRows.flatMap((j) => j.ecosystems ?? [])).size;
  console.log(
    `   · ${featured} featured · ${sponsored} sponsored · ` +
      `${categories} categories · ${seniorities} seniorities · ${ecosystems} ecosystems`,
  );
  console.log("✓ Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  });
