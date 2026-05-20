import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellOff, BellRing, CircleAlert } from "lucide-react";
import { eq } from "drizzle-orm";
import { db, jobAlerts } from "@/db";
import { GlassNav } from "@/components/layout/glass-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Job alert · chainwork",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;
type Search = Promise<{ unsubscribe?: string }>;

/**
 * Landing for the links inside alert emails. Default → confirms the
 * alert (double opt-in). `?unsubscribe=1` → deactivates it.
 */
export default async function AlertConfirmPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { token } = await params;
  const { unsubscribe } = await searchParams;
  const isUnsubscribe = Boolean(unsubscribe);

  const [alert] = await db
    .select()
    .from(jobAlerts)
    .where(eq(jobAlerts.token, token))
    .limit(1);

  let state: "confirmed" | "unsubscribed" | "notfound";
  if (!alert) {
    state = "notfound";
  } else if (isUnsubscribe) {
    await db
      .update(jobAlerts)
      .set({ active: false })
      .where(eq(jobAlerts.id, alert.id));
    state = "unsubscribed";
  } else {
    await db
      .update(jobAlerts)
      .set({ verified: true })
      .where(eq(jobAlerts.id, alert.id));
    state = "confirmed";
  }

  const copy = {
    confirmed: {
      icon: <BellRing size={26} className="text-accent-green" />,
      ring: "border-accent-green/30 bg-accent-green/10",
      title: "Your job alert is live",
      body: "You will get an email when new roles match your filters.",
    },
    unsubscribed: {
      icon: <BellOff size={26} className="text-text-tertiary" />,
      ring: "border-line bg-glass",
      title: "Unsubscribed",
      body: "You will no longer receive emails for this alert.",
    },
    notfound: {
      icon: <CircleAlert size={26} className="text-accent-amber" />,
      ring: "border-accent-amber/30 bg-accent-amber/10",
      title: "Link not recognised",
      body: "This alert link is invalid or has already been removed.",
    },
  }[state];

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto flex max-w-[480px] flex-col items-center px-5 py-24 text-center md:py-32">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${copy.ring}`}
          >
            {copy.icon}
          </span>
          <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.02em] text-text-primary md:text-[28px]">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-[360px] text-[14px] leading-relaxed text-text-secondary">
            {copy.body}
          </p>
          <Link href="/jobs" className="cw-apply mt-6 h-11 px-5 text-[14px]">
            Browse roles
            <ArrowRight size={15} strokeWidth={2.4} />
          </Link>
        </div>
      </main>
    </div>
  );
}
