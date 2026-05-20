import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bookmark, Briefcase } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { ListRow } from "@/components/jobs/list-row";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerSession } from "@/lib/auth";
import { getJobsByPoster } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account · chainwork",
  robots: { index: false, follow: false },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
      {children}
    </h2>
  );
}

export default async function MePage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in?next=/me");

  const { user } = session;
  const myJobs = await getJobsByPoster(user.id);
  const initial = (user.name?.trim()?.[0] ?? user.email[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[760px] px-5 pb-20 pt-6 md:pt-8">
          {/* identity */}
          <div className="flex items-center gap-3.5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-glass-hi text-[20px] font-semibold text-text-primary">
              {initial}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-semibold tracking-[-0.02em] text-text-primary">
                {user.name?.trim() || "Your account"}
              </h1>
              <div className="truncate text-[13px] text-text-tertiary">
                {user.email}
              </div>
            </div>
            <div className="ml-auto shrink-0">
              <SignOutButton />
            </div>
          </div>

          {/* posted roles */}
          <section className="mt-9">
            <SectionLabel>
              <Briefcase size={12} /> Roles you posted
              <span className="text-text-muted">· {myJobs.length}</span>
            </SectionLabel>
            {myJobs.length > 0 ? (
              <div className="divide-y divide-subtle overflow-hidden rounded-2xl border border-subtle">
                {myJobs.map((job) => (
                  <ListRow key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
                <p className="text-[13px] text-text-tertiary">
                  You haven&apos;t posted any roles yet.
                </p>
                <Link href="/post" className="cw-apply h-9 px-4 text-[13px]">
                  Post a role
                  <ArrowRight size={13} strokeWidth={2.4} />
                </Link>
              </div>
            )}
          </section>

          {/* saved roles */}
          <section className="mt-8">
            <SectionLabel>
              <Bookmark size={12} /> Saved roles
            </SectionLabel>
            <Link
              href="/me/saved"
              className="flex items-center justify-between gap-3 rounded-2xl border border-subtle bg-surface px-5 py-4 transition-colors hover:border-line"
            >
              <span className="text-[13px] text-text-secondary">
                Roles you bookmarked, in one place.
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-text-bright">
                View saved
                <ArrowRight size={13} strokeWidth={2.4} />
              </span>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
