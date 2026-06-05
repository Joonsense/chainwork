import type { Metadata } from "next";
import Link from "next/link";
import { GlassNav } from "@/components/layout/glass-nav";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Pricing · ChainWork",
  description:
    "Free for ATS-verified companies. Paid posts from $99 — settled in BTC, ETH, USDC, or any of 200+ tokens via NowPayments.",
  alternates: { canonical: `${SITE_URL}/pricing` },
};

type Tier = {
  name: string;
  price: string;
  unit: string;
  cta: { label: string; href: string };
  features: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "ATS ingest",
    price: "Free",
    unit: "forever",
    cta: { label: "Add my company", href: "mailto:hello@chainwork.xx" },
    features: [
      "Auto-import from Greenhouse, Lever, or Ashby",
      "Daily refresh (06:00 UTC)",
      "Engineering roles only — non-eng filtered out",
      "JSON-LD + agent-readable markdown per role",
      "No featured placement",
    ],
  },
  {
    name: "Standard post",
    price: "$99",
    unit: "per role · 30 days",
    cta: { label: "Post a job", href: "/post" },
    highlight: true,
    features: [
      "Hand-written 3-step post flow",
      "Indexed within minutes — full JSON-LD",
      "Surfaced in MCP, REST API, llms.txt",
      "Email alert push to matching subscribers",
      "Apply via your URL — no candidate gating",
    ],
  },
  {
    name: "Featured",
    price: "$299",
    unit: "per role · 30 days",
    cta: { label: "Post & boost", href: "/post?featured=1" },
    features: [
      "Everything in Standard, plus:",
      "Homepage featured slot rotation",
      "Top-of-list placement in /jobs",
      "Bold rendering across the catalog",
      "Pulse dashboard inclusion",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[960px] px-5 pb-24 pt-6 md:pt-10">
          <header className="mb-12 text-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              Pricing
            </span>
            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.025em] text-text-primary md:text-[40px]">
              Pay in crypto. Or not at all.
            </h1>
            <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-relaxed text-text-secondary">
              Verified ATS feeds are always free. Paid posts settle on-chain
              via NowPayments — BTC, ETH, USDC, SOL, and 200+ other tokens.
            </p>
          </header>

          <section className="mb-12 grid gap-5 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col rounded-xl border bg-surface-elevated p-6 ${
                  tier.highlight
                    ? "border-accent-blue/60 shadow-[0_0_40px_-12px_rgba(99,179,237,0.4)]"
                    : "border-border-subtle"
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-[15px] font-semibold text-text-primary">
                    {tier.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
                      {tier.price}
                    </span>
                    <span className="text-[12px] text-text-tertiary">
                      {tier.unit}
                    </span>
                  </div>
                </div>

                <ul className="mb-6 flex-1 space-y-2 text-[13px] leading-relaxed text-text-secondary">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-accent-blue" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.cta.href}
                  className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-[13px] font-medium transition-colors ${
                    tier.highlight
                      ? "bg-accent-blue text-bg-base hover:opacity-90"
                      : "border border-border-subtle bg-transparent text-text-primary hover:bg-surface-elevated"
                  }`}
                >
                  {tier.cta.label}
                </Link>
              </div>
            ))}
          </section>

          <section className="mb-12 rounded-xl border border-border-subtle bg-surface-elevated p-6">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              How crypto checkout works
            </h2>
            <ol className="space-y-3 text-[14px] leading-relaxed text-text-secondary">
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue/15 font-mono text-[12px] font-semibold text-accent-blue">
                  1
                </span>
                <span>
                  Submit the post via{" "}
                  <Link
                    href="/post"
                    className="text-accent-blue hover:underline"
                  >
                    /post
                  </Link>
                  . Preview is free.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue/15 font-mono text-[12px] font-semibold text-accent-blue">
                  2
                </span>
                <span>
                  We generate a NowPayments invoice with your chosen token —
                  BTC, ETH, USDC, USDT, SOL, MATIC, BNB, and ~200 more.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue/15 font-mono text-[12px] font-semibold text-accent-blue">
                  3
                </span>
                <span>
                  On-chain confirmation triggers indexing. Your role goes live,
                  alerts fire, and the apply URL is yours to track.
                </span>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Common questions
            </h2>
            <dl className="space-y-5 text-[14px] leading-relaxed">
              <div>
                <dt className="font-semibold text-text-primary">
                  Why no fiat / Stripe option?
                </dt>
                <dd className="mt-1 text-text-secondary">
                  Our buyers are crypto companies paying engineers in crypto.
                  Settling in tokens matches the rest of their stack. We may
                  add fiat later if there&apos;s demand — for now, on-chain is
                  cleaner.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-text-primary">
                  Is the post auto-renewed?
                </dt>
                <dd className="mt-1 text-text-secondary">
                  No. 30 days then expires. You can re-post or extend with a
                  new invoice.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-text-primary">
                  Can I post if I&apos;m hiring through Greenhouse / Lever /
                  Ashby?
                </dt>
                <dd className="mt-1 text-text-secondary">
                  Yes — but you probably don&apos;t need to. Send us your ATS
                  slug and we auto-ingest you free. Standard / Featured is for
                  companies not on a supported ATS, or for boosting specific
                  roles above the auto-imported feed.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-text-primary">Refunds?</dt>
                <dd className="mt-1 text-text-secondary">
                  Crypto payments are non-reversible by design. If we fail to
                  index a paid post within 24 hours, email us and we&apos;ll
                  refund in the same token.
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
    </div>
  );
}
