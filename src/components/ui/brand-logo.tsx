/**
 * Chainwork wordmark: a brand-gradient tile holding a chain-link glyph
 * (two interlocked links) plus the "chainwork" lockup. The glyph encodes
 * "chain + work" and stays legible down to favicon size. The favicon
 * (app/icon.tsx) and OG image render the same mark for a coherent brand.
 */
export function BrandLogo({ size = 15 }: { size?: number }) {
  const mark = size + 5;
  return (
    <span
      className="inline-flex items-center gap-2 font-semibold tracking-tight text-text-primary"
      style={{ fontSize: size }}
    >
      <span
        className="relative flex shrink-0 items-center justify-center rounded-[5px] bg-gradient-brand"
        style={{
          width: mark,
          height: mark,
          boxShadow:
            "0 0 12px oklch(0.6 0.18 270 / 0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        <ChainGlyph size={Math.round(mark * 0.62)} />
      </span>
      <span>chainwork</span>
    </span>
  );
}

/** Two interlocked chain links, white on the gradient tile. */
export function ChainGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* left link */}
      <rect x="2.5" y="8" width="11" height="8" rx="4" />
      {/* right link, interlocked */}
      <rect x="10.5" y="8" width="11" height="8" rx="4" />
    </svg>
  );
}
