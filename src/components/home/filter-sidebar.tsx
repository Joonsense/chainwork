import { Check } from "lucide-react";
import { EcoBadge } from "@/components/ui/eco-badge";

/* Static placeholder — real filtering is wired up in P4. */

type Row = { label: string; count?: number; checked?: boolean; eco?: string };

const LOCATION: Row[] = [
  { label: "Remote · Worldwide", count: 1284, checked: true },
  { label: "Remote · Americas", count: 612 },
  { label: "Remote · Europe", count: 508 },
  { label: "Hybrid / Onsite", count: 342 },
];

const ROLE: Row[] = [
  { label: "Protocol", count: 412 },
  { label: "Smart Contracts", count: 387 },
  { label: "ZK / Cryptography", count: 142 },
  { label: "AI x Crypto", count: 218, checked: true },
  { label: "Infra / DevOps", count: 174 },
];

const ECOSYSTEM: Row[] = [
  { label: "EVM", count: 812, eco: "evm" },
  { label: "Solana", count: 287, eco: "sol" },
  { label: "ZK / Rollups", count: 196, eco: "zk" },
  { label: "Bitcoin", count: 64, eco: "btc" },
  { label: "AI x Crypto", count: 218, eco: "ai" },
];

function CheckRow({ row }: { row: Row }) {
  return (
    <div className="flex items-center justify-between gap-2 py-[5px] text-[12.5px] text-text-secondary">
      <span className="flex items-center gap-2">
        <span
          className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border ${
            row.checked
              ? "border-transparent bg-gradient-brand"
              : "border-strong"
          }`}
        >
          {row.checked && <Check size={9} strokeWidth={3} className="text-white" />}
        </span>
        {row.eco && <EcoBadge ecosystem={row.eco} />}
        {row.label}
      </span>
      {row.count != null && (
        <span className="font-mono text-[10.5px] text-text-muted">
          {row.count}
        </span>
      )}
    </div>
  );
}

function Group({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-subtle py-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-[12px] font-semibold text-text-primary">
          {title}
        </span>
        {note && (
          <span className="text-[10.5px] text-text-muted">· {note}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export function FilterSidebar({ className = "" }: { className?: string }) {
  return (
    <aside className={`self-start lg:sticky lg:top-20 ${className}`}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text-primary">
          Filters
        </span>
        <span className="font-mono text-[11px] text-text-tertiary">Reset · 1</span>
      </div>

      <Group title="Compensation" note="$180–310k">
        <div className="relative my-3 h-1 rounded-full bg-surface-3">
          <div className="absolute inset-y-0 left-[28%] right-[22%] rounded-full bg-gradient-brand" />
          <div className="absolute -top-[3px] left-[28%] h-2.5 w-2.5 rounded-full bg-text-primary shadow-[0_0_8px_oklch(0.6_0.18_270/0.6)]" />
          <div className="absolute -top-[3px] left-[78%] h-2.5 w-2.5 rounded-full bg-text-primary shadow-[0_0_8px_oklch(0.6_0.18_270/0.6)]" />
        </div>
        <CheckRow row={{ label: "Token / equity included", checked: true }} />
        <CheckRow row={{ label: "Salary disclosed" }} />
      </Group>

      <Group title="Location">
        {LOCATION.map((r) => (
          <CheckRow key={r.label} row={r} />
        ))}
      </Group>

      <Group title="Role category">
        {ROLE.map((r) => (
          <CheckRow key={r.label} row={r} />
        ))}
      </Group>

      <Group title="Posted">
        <div className="flex gap-1">
          {["24h", "7d", "30d", "All"].map((t, i) => (
            <span
              key={t}
              className={`flex-1 rounded-md border px-2 py-1 text-center font-mono text-[11px] ${
                i === 1
                  ? "border-strong bg-glass-hi text-text-primary"
                  : "border-subtle text-text-secondary"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </Group>

      <Group title="Ecosystem" note="optional">
        {ECOSYSTEM.map((r) => (
          <CheckRow key={r.label} row={r} />
        ))}
      </Group>
    </aside>
  );
}
