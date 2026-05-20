import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bookmark } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { ListRow } from "@/components/jobs/list-row";
import { getServerSession } from "@/lib/auth";
import { getSavedJobs } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved roles · chainwork",
  robots: { index: false, follow: false },
};

export default async function SavedRolesPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in?next=/me/saved");

  const saved = await getSavedJobs(session.user.id);

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[760px] px-5 pb-20 pt-6 md:pt-8">
          <header className="mb-6 flex items-center gap-2">
            <Bookmark size={18} className="text-accent-blue" />
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
              Saved roles
            </h1>
            <span className="text-[13px] text-text-tertiary">
              · {saved.length}
            </span>
          </header>

          {saved.length > 0 ? (
            <div className="divide-y divide-subtle overflow-hidden rounded-2xl border border-subtle">
              {saved.map((job) => (
                <ListRow key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
              <p className="max-w-[320px] text-[13px] text-text-tertiary">
                No saved roles yet. Tap the bookmark on any role to keep it
                here.
              </p>
              <Link href="/jobs" className="cw-apply h-9 px-4 text-[13px]">
                Browse roles
                <ArrowRight size={13} strokeWidth={2.4} />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
