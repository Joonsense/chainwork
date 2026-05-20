import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlassNav } from "@/components/layout/glass-nav";
import { getAllCompanies } from "@/db/queries";
import { PostWizard } from "./post-wizard";

/* Token-gated, never indexed, always fresh. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Post a role · chainwork",
  robots: { index: false, follow: false },
};

/**
 * Admin job-posting form (P7). Gated by `?token=` matching ADMIN_POST_TOKEN
 * — a deliberate stopgap so curation can start before real auth (P8).
 * A missing or wrong token is indistinguishable from a missing page.
 */
export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const adminToken = process.env.ADMIN_POST_TOKEN;
  if (!adminToken || !token || token !== adminToken) {
    notFound();
  }

  const companies = await getAllCompanies();

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[820px] px-5 pb-24 pt-6 md:pt-8">
          <header className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              Admin · curation
            </span>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-text-primary md:text-[34px]">
              Post a role
            </h1>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              Add a role to the board — company, then the role, then a
              preview before it goes live.
            </p>
          </header>

          <PostWizard token={token} companies={companies} />
        </div>
      </main>
    </div>
  );
}
