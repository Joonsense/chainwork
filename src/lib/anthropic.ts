import Anthropic from "@anthropic-ai/sdk";
import { ECOSYSTEM_OPTIONS } from "@/lib/jobs-search-params";

/**
 * AI skill extraction (P10). Turns a GitHub profile / CV text blob into
 * web3-relevant skills + ecosystems via Claude Haiku.
 *
 * With no ANTHROPIC_API_KEY it falls back to a keyword heuristic, so the
 * matching flow stays testable before the key is wired.
 */

export type ExtractedProfile = { skills: string[]; ecosystems: string[] };

const apiKey = process.env.ANTHROPIC_API_KEY;
export const aiEnabled = Boolean(apiKey);

const KNOWN_ECO = new Set(ECOSYSTEM_OPTIONS);

/* ── heuristic fallback ─────────────────────────────────────── */

const SKILL_TERMS = [
  "rust", "solidity", "go", "typescript", "react", "next.js", "python",
  "halo2", "plonky3", "foundry", "hardhat", "circom", "cairo", "wasm",
  "zk", "snark", "stark", "consensus", "p2p", "kubernetes", "terraform",
  "move", "viem", "wagmi", "anchor", "cosmwasm", "graphql", "postgres",
  "pytorch", "llm", "node.js", "docker",
];

const ECO_HINTS: Record<string, string[]> = {
  evm: ["solidity", "evm", "ethereum", "foundry", "hardhat", "viem"],
  sol: ["solana", "anchor"],
  btc: ["bitcoin", "lightning"],
  zk: ["zk", "halo2", "plonky", "snark", "stark", "circom"],
  base: ["base"],
  arb: ["arbitrum"],
  opt: ["optimism"],
  pol: ["polygon"],
  cos: ["cosmos", "cosmwasm", "ibc"],
  sui: ["sui", " move"],
  ai: ["pytorch", "tensorflow", "llm", "machine learning", " ml "],
};

function heuristicExtract(text: string): ExtractedProfile {
  const lower = ` ${text.toLowerCase()} `;
  const skills = SKILL_TERMS.filter((t) => lower.includes(t)).slice(0, 14);
  const ecosystems = Object.entries(ECO_HINTS)
    .filter(([, hints]) => hints.some((h) => lower.includes(h)))
    .map(([key]) => key);
  return { skills, ecosystems };
}

/* ── AI extraction ──────────────────────────────────────────── */

const SYSTEM = `You extract a candidate's technical skills from their GitHub profile or CV, for a web3/crypto job board.
Return ONLY a JSON object, no prose, shaped exactly:
{"skills": string[], "ecosystems": string[]}
- skills: concrete lowercase technical tokens (languages, frameworks, domains) — e.g. "rust", "solidity", "halo2", "consensus". 6-16 items.
- ecosystems: which crypto ecosystems the candidate shows affinity for, ONLY from this set: ${ECOSYSTEM_OPTIONS.join(", ")}.`;

/** Extracts web3-relevant skills + ecosystems from a profile/CV text blob. */
export async function extractSkills(text: string): Promise<ExtractedProfile> {
  const trimmed = text.slice(0, 12_000); // keep the prompt bounded
  if (!apiKey) return heuristicExtract(trimmed);

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Extract skills and ecosystems from this profile:\n\n${trimmed}`,
        },
      ],
    });

    const block = message.content.find((b) => b.type === "text");
    const raw = block && block.type === "text" ? block.text : "{}";
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as Partial<ExtractedProfile>;

    return {
      skills: (parsed.skills ?? [])
        .map((s) => String(s).toLowerCase().trim())
        .filter(Boolean)
        .slice(0, 16),
      ecosystems: (parsed.ecosystems ?? []).filter((e) => KNOWN_ECO.has(e)),
    };
  } catch (err) {
    console.error("Anthropic skill extraction failed — using heuristic:", err);
    return heuristicExtract(trimmed);
  }
}
