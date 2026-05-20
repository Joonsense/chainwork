"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Loader2, Sparkles } from "lucide-react";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { formatSalary } from "@/lib/format";

type Match = {
  slug: string;
  title: string;
  fit: number;
  companyName: string;
  logoText: string;
  logoBg: string;
  logoFg: string;
  salaryMin: number;
  salaryMax: number;
};

type MatchData =
  | { status: "anon" }
  | { status: "no-source" }
  | {
      status: "ready";
      username: string | null;
      source: "github" | "cv" | null;
      skills: string[];
      ecosystems: string[];
      matches: Match[];
    };

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <aside className="cw-bordered rounded-2xl border border-subtle bg-surface p-4">
      <header className="mb-3 flex items-center gap-1.5">
        <Sparkles size={13} className="text-accent-purple" />
        <span className="text-[12.5px] font-semibold text-text-primary">
          AI matches for you
        </span>
        <span className="rounded-[4px] border border-accent-purple/40 bg-accent-purple/15 px-1 font-mono text-[8.5px] uppercase tracking-wide text-accent-purple">
          beta
        </span>
      </header>
      {children}
    </aside>
  );
}

export function AiMatchPanel() {
  const [data, setData] = useState<MatchData | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/match")
      .then((r) => r.json())
      .then((d: MatchData) => active && setData(d))
      .catch(() => active && setData({ status: "no-source" }));
    return () => {
      active = false;
    };
  }, []);

  // loading — covers the inline first-time indexing
  if (data === null) {
    return (
      <PanelShell>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Loader2 size={18} className="animate-spin text-accent-purple" />
          <p className="text-[12px] text-text-tertiary">
            Indexing your profile…
          </p>
        </div>
      </PanelShell>
    );
  }

  // signed out
  if (data.status === "anon") {
    return (
      <PanelShell>
        <p className="text-[12.5px] leading-[1.55] text-text-secondary">
          Connect GitHub and we&apos;ll surface the roles that fit your skills.
        </p>
        <SignInDialog
          trigger={
            <button
              type="button"
              className="cw-apply mt-3 h-9 w-full text-[12.5px]"
            >
              Connect GitHub
              <ArrowRight size={13} strokeWidth={2.4} />
            </button>
          }
        />
      </PanelShell>
    );
  }

  // signed in, no profile source
  if (data.status === "no-source") {
    return (
      <PanelShell>
        <p className="text-[12.5px] leading-[1.55] text-text-secondary">
          Connect GitHub to get matched to roles by your skills — or upload a
          CV instead.
        </p>
        <SignInDialog
          trigger={
            <button
              type="button"
              className="cw-apply mt-3 h-9 w-full text-[12.5px]"
            >
              Connect GitHub
              <ArrowRight size={13} strokeWidth={2.4} />
            </button>
          }
        />
        <Link
          href="/me/cv"
          className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-line text-[12.5px] text-text-secondary transition-colors hover:border-strong hover:text-text-primary"
        >
          <FileText size={13} />
          Upload a CV
        </Link>
      </PanelShell>
    );
  }

  // ready
  const top = data.matches.slice(0, 3);
  const context =
    data.source === "cv"
      ? "Based on your CV"
      : `Based on @${data.username ?? "you"}'s GitHub`;

  return (
    <PanelShell>
      <p className="mb-3 text-[11px] leading-[1.5] text-text-tertiary">
        {context}
        {data.skills.length > 0 && (
          <>
            {" · "}
            <span className="text-text-secondary">
              {data.skills.slice(0, 3).join(", ")}
            </span>
          </>
        )}
      </p>

      {top.length === 0 ? (
        <p className="py-2 text-[12px] text-text-tertiary">
          No strong matches yet — check back as new roles land.
        </p>
      ) : (
        <div className="space-y-1">
          {top.map((m) => (
            <Link
              key={m.slug}
              href={`/jobs/${m.slug}`}
              className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-glass"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-[11px] font-semibold"
                style={{ background: m.logoBg, color: m.logoFg }}
              >
                {m.logoText}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-text-primary">
                  {m.title}
                </span>
                <span className="block truncate font-mono text-[10.5px] text-text-tertiary">
                  {m.companyName} · {formatSalary(m.salaryMin, m.salaryMax)}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[12px] font-semibold text-accent-purple">
                {m.fit}%
              </span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/jobs?sort=fit"
        className="mt-3 flex items-center justify-center gap-1 text-[12px] font-medium text-accent-blue transition-colors hover:text-text-primary"
      >
        See all matches
        <ArrowRight size={12} strokeWidth={2.4} />
      </Link>
    </PanelShell>
  );
}
