import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GlassNav } from "@/components/layout/glass-nav";
import { getServerSession } from "@/lib/auth";
import { CvUpload } from "./cv-upload";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Upload your CV · chainwork",
  robots: { index: false, follow: false },
};

export default async function CvPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in?next=/me/cv");

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[520px] px-5 pb-24 pt-6 md:pt-10">
          <header className="mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              AI matching
            </span>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-text-primary md:text-[32px]">
              Upload your CV
            </h1>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              No GitHub? Upload a PDF or DOCX résumé — we extract your skills
              and match you to roles.
            </p>
          </header>
          <CvUpload />
        </div>
      </main>
    </div>
  );
}
