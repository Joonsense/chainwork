import { ECOSYSTEMS } from "@/lib/ecosystems";

/** Ecosystem monogram square (spec §2.2) — e.g. EVM, SOL, ZK. */
export function EcoBadge({ ecosystem }: { ecosystem: string }) {
  const meta = ECOSYSTEMS[ecosystem];
  if (!meta) return null;
  return (
    <span
      className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 font-mono text-[9px] font-semibold tracking-tight"
      style={{ background: meta.bg, color: meta.fg }}
    >
      {meta.label}
    </span>
  );
}
