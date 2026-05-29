import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";

export const metadata: Metadata = {
  title: "Role published",
  robots: { index: false, follow: false },
};

/**
 * Post-submit confirmation. `?slug=` links to the live role; `?featured=`
 * reflects the Stripe Checkout outcome (paid · cancelled).
 */
export default async function PostSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; featured?: string }>;
}) {
  const { slug, featured } = await searchParams;
  const paid = featured === "paid";
  const cancelled = featured === "cancelled";

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto flex max-w-[560px] flex-col items-center px-5 py-24 text-center md:py-32">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
              paid
                ? "border-accent-purple/40 bg-accent-purple/15"
                : "border-accent-green/30 bg-accent-green/10"
            }`}
          >
            {paid ? (
              <Sparkles size={24} className="text-accent-purple" />
            ) : (
              <Check size={26} strokeWidth={2.4} className="text-accent-green" />
            )}
          </span>

          <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.025em] text-text-primary md:text-[32px]">
            {paid ? "Your role is live and featured" : "Your role is live"}
          </h1>
          <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-text-secondary">
            {paid
              ? "Payment received. It is pinned to the top of the home page and the /jobs feed for the next 14 days."
              : "It is on the board now — and already in the agent layer (llms.txt, per-role markdown, and the JSON API)."}
          </p>

          {cancelled && (
            <p className="mt-3 max-w-[420px] rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-[12.5px] text-text-secondary">
              The Featured upgrade was not completed — your role is still live,
              just not featured.
            </p>
          )}

          <Link
            href={slug ? `/jobs/${slug}` : "/jobs"}
            className="cw-apply mt-6 h-11 px-5 text-[14px]"
          >
            {slug ? "View your role" : "Browse all roles"}
            <ArrowRight size={15} strokeWidth={2.4} />
          </Link>

          {!paid && (
            <div className="mt-9 w-full rounded-2xl border border-accent-purple/25 bg-accent-purple/[0.07] p-5 text-left">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-accent-purple" />
                <span className="text-[13px] font-semibold text-text-primary">
                  Want more visibility?
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-text-secondary">
                A Featured slot pins your role to the top of the home page and
                the /jobs feed for two weeks ($199). Toggle Featured on review
                when you post a role.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
