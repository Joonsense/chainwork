import Link from "next/link";
import { GlassNav } from "@/components/layout/glass-nav";

export default function NotFound() {
  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto flex max-w-[640px] flex-col items-center px-5 py-28 text-center md:py-36">
          <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-accent-blue">
            404
          </span>
          <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-text-primary md:text-[36px]">
            This role isn&apos;t here
          </h1>
          <p className="mt-3 max-w-[420px] text-[14px] leading-relaxed text-text-secondary">
            The job may have been filled, or the link is wrong. Browse the live
            roles instead.
          </p>
          <Link href="/" className="cw-apply mt-6 h-10 px-4 text-[13px]">
            Back to all roles
          </Link>
        </div>
      </main>
    </div>
  );
}
