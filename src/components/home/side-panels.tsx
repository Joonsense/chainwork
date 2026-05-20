import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/* Right-rail panels. The live AI-match panel (P10) renders separately on
   /jobs; this rail keeps the job-alerts and salary-insight cards. */

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
      <SalaryInsightPanel />
    </aside>
  );
}
