/**
 * Deterministic monogram + colour for companies created from a public
 * submission, where the submitter never picks a logo. Same name → same
 * lockup every time, so re-publishing is idempotent on appearance.
 */

const LOGO_PALETTE: { bg: string; fg: string }[] = [
  { bg: "#1e69ff", fg: "#fafaf7" },
  { bg: "#9945ff", fg: "#fafaf7" },
  { bg: "#f7931a", fg: "#0a0a0a" },
  { bg: "oklch(0.42 0.13 155)", fg: "#fafaf7" },
  { bg: "#28a0f0", fg: "#fafaf7" },
  { bg: "#6f41d8", fg: "#fafaf7" },
  { bg: "#0052ff", fg: "#fafaf7" },
  { bg: "#171717", fg: "#fafaf7" },
];

/** 1–3 char uppercase monogram, e.g. "Helix Labs" → "HL". */
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length >= 2
      ? words[0][0] + words[1][0]
      : (words[0] ?? name).slice(0, 2);
  return letters.toUpperCase().slice(0, 3) || "?";
}

/** Stable bg/fg pair picked from the palette by hashing a seed string. */
export function logoColors(seed: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return LOGO_PALETTE[h % LOGO_PALETTE.length];
}
