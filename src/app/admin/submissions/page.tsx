import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { GlassNav } from "@/components/layout/glass-nav";
import { db, jobSubmissions } from "@/db";
import { getAdminSession } from "@/lib/admin";
import type { SubmissionForm } from "@/lib/submission-schema";
import { SubmissionQueue, type QueueItem } from "./queue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submission queue",
  robots: { index: false, follow: false },
};

/** Moderation queue for public /submit entries. Admin-only. */
export default async function AdminSubmissionsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/sign-in?next=/admin/submissions");

  const rows = await db
    .select()
    .from(jobSubmissions)
    .orderBy(desc(jobSubmissions.createdAt))
    .limit(200);

  // Pending first, then the rest by recency.
  const sorted = [...rows].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const items: QueueItem[] = sorted.map((r) => ({
    id: r.id,
    status: r.status,
    submitterEmail: r.submitterEmail,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    data: r.data as unknown as SubmissionForm,
  }));

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative mx-auto max-w-[820px] px-5 pb-24 pt-6 md:pt-8">
        <header className="mb-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
            Admin
          </span>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-text-primary md:text-[32px]">
            Submission queue
          </h1>
          <p className="mt-1.5 text-[14px] text-text-secondary">
            {pendingCount} pending · publishing builds the live company + role
            and exposes it across the board, collections, sitemap, and
            llms.txt.
          </p>
        </header>

        <SubmissionQueue items={items} />
      </main>
    </div>
  );
}
