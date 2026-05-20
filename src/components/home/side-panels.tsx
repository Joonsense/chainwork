import { Zap, Sparkles, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

/* Right-rail panels. Both are visual placeholders — job alerts ship in
   P9, AI matching in P10. */

function JobAlertsPanel() {
  return (
    <div className="cw-card cw-bordered cw-card-glow rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-primary">
          <Zap size={12} className="text-accent-cyan" />
          Job alerts
        </span>
        <span className="rounded-[5px] border border-subtle bg-glass px-1.5 py-0.5 font-mono text-[9px] text-text-tertiary">
          FREE
        </span>
      </div>
      <p className="mb-3 text-[11.5px] leading-[1.55] text-text-secondary">
        Get a ping the moment a matching role goes live — based on your current
        filters.
      </p>
      <div
        className="mb-2 flex h-[34px] items-center rounded-lg border border-line bg-surface px-3 text-[12px] text-text-tertiary"
        aria-hidden
      >
        you@email
      </div>
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {["Email", "Telegram", "Webhook"].map((c, i) => (
          <span
            key={c}
            className={`rounded-md border px-2 py-1.5 text-center text-[11px] ${
              i === 0
                ? "border-strong bg-glass-hi text-text-primary"
                : "border-subtle text-text-secondary"
            }`}
          >
            {c}
          </span>
        ))}
      </div>
      <button type="button" className="cw-apply mt-1 h-[34px] w-full text-[12.5px]">
        Subscribe to alerts
      </button>
      <div className="mt-3 flex items-center justify-between border-t border-subtle pt-2.5 text-[10.5px] text-text-tertiary">
        <span>Subscribers</span>
        <span className="font-mono text-text-bright">84,206</span>
      </div>
    </div>
  );
}

function AiMatchesPanel() {
  return (
    <div className="cw-card rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-primary">
          <Sparkles size={12} className="text-accent-purple" />
          AI matches for you
        </span>
        <span className="rounded-[5px] border border-accent-purple/40 bg-accent-purple/15 px-1.5 py-0.5 font-mono text-[9px] text-accent-purple">
          BETA
        </span>
      </div>
      <p className="mb-3 text-[11.5px] leading-[1.55] text-text-secondary">
        Connect GitHub or upload a CV and chainwork re-ranks every role by
        code-based fit.
      </p>
      <button
        type="button"
        className="flex h-[34px] w-full items-center justify-center gap-2 rounded-lg border border-line bg-glass text-[12px] font-medium text-text-bright transition-colors hover:border-strong"
      >
        <GitBranch size={13} />
        Connect GitHub
      </button>
      <div className="mt-3 space-y-2 border-t border-subtle pt-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2.5 opacity-40">
            <span className="h-7 w-7 shrink-0 rounded-md bg-surface-3" />
            <div className="flex-1 space-y-1.5">
              <span className="block h-2 w-3/4 rounded-full bg-surface-3" />
              <span className="block h-2 w-1/2 rounded-full bg-surface-3" />
            </div>
            <span className="h-4 w-8 rounded bg-surface-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SalaryInsightPanel() {
  const bars = [12, 18, 26, 34, 42, 38, 30, 24, 18, 14, 11, 8];
  return (
    <div className="cw-card rounded-xl p-4">
      <div className="text-[12.5px] font-semibold text-text-primary">
        Salary insight
      </div>
      <div className="mb-3 text-[11px] text-text-tertiary">
        Senior · protocol · remote
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[24px] font-semibold tracking-tight text-text-primary">
          $214k
        </span>
        <span className="text-[11px] text-accent-green">+8% YoY</span>
      </div>
      <div className="mt-0.5 text-[10px] text-text-muted">
        median base · USD
      </div>
      <div className="mt-3 flex h-[42px] items-end gap-1" aria-hidden>
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[2px] ${
              i === 4 ? "bg-gradient-brand" : "bg-surface-3"
            }`}
            style={{ height: h }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-text-muted">
        <span>$120k</span>
        <span>$400k</span>
      </div>
    </div>
  );
}

export function SidePanels({ className = "" }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-3.5 self-start lg:sticky lg:top-20",
        className,
      )}
    >
      <JobAlertsPanel />
      <AiMatchesPanel />
      <SalaryInsightPanel />
    </aside>
  );
}
