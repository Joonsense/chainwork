import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";

export const metadata: Metadata = {
  title: "Role published · chainwork",
  robots: { index: false, follow: false },
};

/** Post-submit confirmation. `?slug=` links straight to the live role. */
export default async function PostSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto flex max-w-[560px] flex-col items-center px-5 py-24 text-center md:py-32">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-green/30 bg-accent-green/10">
            <Check size={26} strokeWidth={2.4} className="text-accent-green" />
          </span>

          <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.025em] text-text-primary md:text-[32px]">
            Your role is live
          </h1>
          <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-text-secondary">
            It is on the board now — and already in the agent layer (llms.txt,
            per-role markdown, and the JSON API).
          </p>

          {slug ? (
            <Link
              href={`/jobs/${slug}`}
              className="cw-apply mt-6 h-11 px-5 text-[14px]"
            >
              Your role is live
              <ArrowRight size={15} strokeWidth={2.4} />
            </Link>
          ) : (
            <Link
              href="/jobs"
              className="cw-apply mt-6 h-11 px-5 text-[14px]"
            >
              Browse all roles
              <ArrowRight size={15} strokeWidth={2.4} />
            </Link>
          )}

          {/* Featured upsell — wired to Stripe in P9. */}
          <div className="mt-9 w-full rounded-2xl border border-accent-purple/25 bg-accent-purple/[0.07] p-5 text-left">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent-purple" />
              <span className="text-[13px] font-semibold text-text-primary">
                Get more visibility
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-text-secondary">
              Upgrade to a Featured slot — pinned to the top of the home page
              and the /jobs feed for two weeks.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-lg border border-line bg-glass px-3.5 text-[12.5px] text-text-tertiary"
            >
              Upgrade to Featured — $199
              <span className="rounded bg-glass-hi px-1.5 py-0.5 font-mono text-[9px] uppercase text-text-muted">
                Soon
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
