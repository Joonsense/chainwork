import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, XCircle } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";

export const metadata: Metadata = {
  title: "Post received",
  robots: { index: false, follow: false },
};

/**
 * Return target for the paid-post checkout. `?status=paid` after a completed
 * payment (the role is paid and queued for a quick review, then goes live);
 * `?status=cancelled` if the buyer backed out of checkout.
 */
export default async function PostSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const cancelled = status === "cancelled";

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto flex max-w-[560px] flex-col items-center px-5 py-24 text-center md:py-32">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
              cancelled
                ? "border-accent-amber/30 bg-accent-amber/10"
                : "border-accent-green/30 bg-accent-green/10"
            }`}
          >
            {cancelled ? (
              <XCircle size={24} className="text-accent-amber" />
            ) : (
              <Check size={26} strokeWidth={2.4} className="text-accent-green" />
            )}
          </span>

          <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.025em] text-text-primary md:text-[32px]">
            {cancelled ? "Checkout cancelled" : "Payment received"}
          </h1>
          <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-text-secondary">
            {cancelled
              ? "No charge was made and your role was not posted. You can start over whenever you're ready."
              : "Thanks. Your role is paid and in the review queue. We check every post for spam and accuracy, then it goes live as a featured listing for a week. We'll email you when it does."}
          </p>

          <Link
            href={cancelled ? "/post" : "/jobs"}
            className="cw-apply mt-6 h-11 px-5 text-[14px]"
          >
            {cancelled ? "Try again" : "Browse all roles"}
            <ArrowRight size={15} strokeWidth={2.4} />
          </Link>
        </div>
      </main>
    </div>
  );
}
