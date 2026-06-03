import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GlassNav } from "@/components/layout/glass-nav";
import { getAllCompanies } from "@/db/queries";
import { getServerSession } from "@/lib/auth";
import { PostWizard } from "./post-wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Post a role",
  robots: { index: false, follow: false },
};

/**
 * Job-posting form. Open to any signed-in user (P8) — the P7 admin-token
 * gate is gone. Signed-out visitors are sent to /sign-in and returned here.
 */
export default async function PostPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in?next=/post");

  const companies = await getAllCompanies();

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[820px] px-5 pb-24 pt-6 md:pt-8">
          <header className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              Hire on Chainwork
            </span>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-text-primary md:text-[34px]">
              Post a role
            </h1>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              Add a role to the board, company, then the role, then a
              preview before it goes live.
            </p>
          </header>

          <PostWizard companies={companies} />
        </div>
      </main>
    </div>
  );
}
