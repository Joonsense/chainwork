/** Chainwork wordmark — brand-gradient mark + "chainwork" lockup. */
export function BrandLogo({ size = 15 }: { size?: number }) {
  const mark = size + 5;
  return (
    <span
      className="inline-flex items-center gap-2 font-semibold tracking-tight text-text-primary"
      style={{ fontSize: size }}
    >
      <span
        className="relative shrink-0 rounded-[5px] bg-gradient-brand"
        style={{
          width: mark,
          height: mark,
          boxShadow:
            "0 0 12px oklch(0.6 0.18 270 / 0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        <span className="absolute inset-[4px] rounded-[2px] bg-base" />
        <span className="absolute left-[4px] top-[4px] h-1 w-1 rounded-[1px] bg-text-primary" />
      </span>
      <span>chainwork</span>
    </span>
  );
}
