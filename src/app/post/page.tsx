import type { Metadata } from "next";
import { GlassNav } from "@/components/layout/glass-nav";
import { SITE_URL } from "@/lib/site";
import { SubmitForm } from "@/app/submit/submit-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Post a job · $150 / week",
  description:
    "Post a crypto, web3, or AI × crypto engineering role from $150 a week. No account needed, pay in crypto (BTC, ETH, USDC, and 200+ tokens). Featured placement, indexed for search and AI engines, readable by humans and AI agents.",
  alternates: { canonical: `${SITE_URL}/post` },
  openGraph: {
    title: "Post a job · $150 / week | Chainwork",
    description:
      "Post a crypto engineering role. No account, pay in crypto, featured to the top.",
    url: `${SITE_URL}/post`,
  },
};

/**
 * Paid "post a job" — public, no login. Payment is the gate (handled inside
 * SubmitForm via createPaidPost -> hosted checkout). Same lean form as the
 * free /submit; the paid tier adds a checkout step and a featured listing
 * once an admin publishes it from the queue.
 */
export default function PostPage() {
  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[760px] px-5 pb-24 pt-6 md:pt-8">
          <header className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              Hire on Chainwork · $150 / week
            </span>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-text-primary md:text-[34px]">
              Post a job
            </h1>
            <p className="mt-2 max-w-[560px] text-[14px] leading-[1.6] text-text-secondary">
              Reach AI × crypto engineers, including the ones searching over MCP
              and AI agents. $150 a week (pick 1, 2, or 4 weeks), featured to
              the top of the board. No account needed, pay in crypto. We review
              for spam and accuracy, then it goes live. Want it free instead?
              Auto-ingest your ATS or use the{" "}
              <a href="/submit" className="text-accent-blue hover:underline">
                free community form
              </a>
              .
            </p>
          </header>

          <SubmitForm tier="paid" />
        </div>
      </main>
    </div>
  );
}
