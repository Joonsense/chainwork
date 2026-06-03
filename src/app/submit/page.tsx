import type { Metadata } from "next";
import { GlassNav } from "@/components/layout/glass-nav";
import { SITE_URL } from "@/lib/site";
import { SubmitForm } from "./submit-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Post a crypto engineering job, free",
  description:
    "Submit an open crypto, web3, or AI × crypto engineering role to Chainwork for free. Salary-transparent listings, indexed for search and AI engines, and discoverable by humans and AI agents.",
  alternates: { canonical: `${SITE_URL}/submit` },
  openGraph: {
    title: "Post a crypto engineering job, free | Chainwork",
    description:
      "Submit an open crypto / web3 / AI × crypto engineering role for free. Reviewed, then published to the open registry.",
    url: `${SITE_URL}/submit`,
  },
};

/**
 * Public, no-auth submission form. Unlike /post (authed wizard), anyone can
 * propose a role here; it lands in the moderation queue and an admin
 * publishes it. Indexable — it doubles as a "post a crypto job free"
 * landing page.
 */
export default function SubmitPage() {
  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[760px] px-5 pb-24 pt-6 md:pt-8">
          <header className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              Hiring? It&apos;s free
            </span>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-text-primary md:text-[34px]">
              Post a crypto engineering role
            </h1>
            <p className="mt-2 max-w-[560px] text-[14px] leading-[1.6] text-text-secondary">
              Submit an open crypto, web3, or AI × crypto role. We review for
              spam and accuracy, then publish it to the open registry, 
              salary-transparent, indexed for search and AI engines, and
              readable by both humans and AI agents. No account needed.
            </p>
          </header>

          <SubmitForm />
        </div>
      </main>
    </div>
  );
}
