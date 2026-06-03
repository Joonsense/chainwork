"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubmissionForm } from "@/lib/submission-schema";
import { publishSubmission, rejectSubmission } from "./actions";

export type QueueItem = {
  id: string;
  status: string;
  submitterEmail: string;
  note: string | null;
  createdAt: string; // ISO
  data: SubmissionForm;
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
    published: "border-accent-green/40 bg-accent-green/10 text-accent-green",
    rejected: "border-line bg-glass text-text-muted",
  };
  return (
    <span
      className={cn(
        "rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em]",
        map[status] ?? map.rejected,
      )}
    >
      {status}
    </span>
  );
}

/** Paid-post marker: green "$150 PAID" when settled, amber "PAID PENDING" when not. */
function PaidPill({ data }: { data: SubmissionForm }) {
  const meta = (data as { _meta?: { kind?: string; paid?: boolean } })._meta;
  if (meta?.kind !== "paid") return null;
  return (
    <span
      className={cn(
        "rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em]",
        meta.paid
          ? "border-accent-green/40 bg-accent-green/10 text-accent-green"
          : "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
      )}
    >
      {meta.paid ? "$150 paid" : "unpaid"}
    </span>
  );
}

function Card({ item }: { item: QueueItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"publish" | "reject" | null>(null);
  const d = item.data;

  function run(kind: "publish" | "reject") {
    setAction(kind);
    startTransition(async () => {
      const res =
        kind === "publish"
          ? await publishSubmission(item.id)
          : await rejectSubmission(item.id);
      if (!res.ok) toast.error(res.error);
      else toast.success(kind === "publish" ? "Published" : "Rejected");
      setAction(null);
      router.refresh();
    });
  }

  const salary =
    d.salaryMin || d.salaryMax
      ? `${d.salaryCurrency} ${d.salaryMin || "?"}–${d.salaryMax || "?"}`
      : "Undisclosed";

  return (
    <div className="rounded-2xl border border-subtle bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-text-primary">
              {d.title}
            </h3>
            <StatusPill status={item.status} />
            <PaidPill data={item.data} />
          </div>
          <div className="mt-0.5 text-[13px] text-text-secondary">
            {d.companyName}
            {d.companyWebsite ? ` · ${d.companyWebsite}` : ""}
          </div>
        </div>
        <div className="text-right font-mono text-[11px] text-text-tertiary">
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[11.5px]">
        {[d.roleCategory, d.seniority, d.employmentType, ...d.ecosystems].map(
          (t, i) => (
            <span
              key={i}
              className="rounded-md border border-line bg-glass-hi px-1.5 py-0.5 text-text-bright"
            >
              {t}
            </span>
          ),
        )}
      </div>

      <div className="mt-2 text-[12.5px] text-text-tertiary">
        {salary} · {d.location} · apply:{" "}
        {d.applyUrl || d.applyEmail || "—"} · from {item.submitterEmail}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-[12px] text-accent-blue">
          Description
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-glass p-3 text-[12.5px] leading-[1.55] text-text-secondary">
          {d.descriptionMd}
        </pre>
      </details>

      {item.note && (
        <p className="mt-2 text-[12.5px] text-text-tertiary">
          Note: {item.note}
        </p>
      )}

      {item.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run("publish")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-accent-green/40 bg-accent-green/10 px-3 text-[13px] font-medium text-accent-green transition-colors hover:bg-accent-green/20 disabled:opacity-60"
          >
            {pending && action === "publish" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Publish
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run("reject")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-glass px-3 text-[13px] font-medium text-text-secondary transition-colors hover:border-strong disabled:opacity-60"
          >
            {pending && action === "reject" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export function SubmissionQueue({ items }: { items: QueueItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface p-10 text-center text-[14px] text-text-secondary">
        No submissions yet.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </div>
  );
}
