/**
 * Ecosystem chip colors (spec §2.2) — ported verbatim from the v2 dark
 * mockup (reference dark-shared.jsx · Eco_dark_colors). `bg` may be a
 * solid color or a gradient.
 */
export type EcosystemMeta = { label: string; bg: string; fg: string };

export const ECOSYSTEMS: Record<string, EcosystemMeta> = {
  evm: { label: "EVM", bg: "#1e1e25", fg: "#c9c9d4" },
  sol: { label: "SOL", bg: "linear-gradient(135deg,#9945ff,#14f195)", fg: "#0a0a0a" },
  btc: { label: "BTC", bg: "#f7931a", fg: "#0a0a0a" },
  opt: { label: "OP", bg: "#ff0420", fg: "#ffffff" },
  arb: { label: "ARB", bg: "#28a0f0", fg: "#ffffff" },
  base: { label: "BASE", bg: "#0052ff", fg: "#ffffff" },
  pol: { label: "POL", bg: "#6f41d8", fg: "#ffffff" },
  cos: { label: "ATOM", bg: "#2e3148", fg: "#ffffff" },
  sui: { label: "SUI", bg: "#4da2ff", fg: "#0a0a0a" },
  zk: { label: "ZK", bg: "#1e69ff", fg: "#ffffff" },
  ai: {
    label: "AI",
    bg: "linear-gradient(135deg, oklch(0.7 0.18 250), oklch(0.68 0.2 295))",
    fg: "#ffffff",
  },
};
