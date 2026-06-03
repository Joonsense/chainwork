import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSalaryInsight, getSubscriberCount } from "@/db/queries";

/* Right-rail panels. The live AI-match panel (P10) renders separately on
   /jobs; this rail keeps the job-alerts CTA and a real salary insight.
   Every number here is computed from live data, no vanity metrics. */

function fmtK(n: number): string {
  return `$${Math.round(n / 1000)}k`;
}

async function JobAlertsPanel() {
  const subscribers = await getSubscriberCount();
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
        Get an email the moment a matching crypto engineering role goes live, 
        filtered by role, ecosystem, and salary.
      </p>
      <a
        href="/alerts"
        className="cw-apply mt-1 flex h-[34px] w-full items-center justify-center text-[12.5px]"
      >
        Create a job alert
      </a>
      {subscribers > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-subtle pt-2.5 text-[10.5px] text-text-tertiary">
          <span>Subscribers</span>
          <span className="font-mono text-text-bright">
            {subscribers.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

async function SalaryInsightPanel() {
  const insight = await getSalaryInsight();
  if (!insight) return null;

  return (
    <div className="cw-card rounded-xl p-4">
      <div className="text-[12.5px] font-semibold text-text-primary">
        Salary insight
      </div>
      <div className="mb-3 text-[11px] text-text-tertiary">
        Median of {insight.sampleSize} salary-transparent roles
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[24px] font-semibold tracking-tight text-text-primary">
          {fmtK(insight.medianMax)}
        </span>
        <span className="text-[11px] text-text-muted">median top of band</span>
      </div>
      <div className="mt-0.5 text-[10px] text-text-muted">
        across listed roles · USD
      </div>
      <div className="mt-3 flex justify-between font-mono text-[9.5px] text-text-muted">
        <span>{fmtK(insight.minMin)}</span>
        <span>{fmtK(insight.maxMax)}</span>
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
