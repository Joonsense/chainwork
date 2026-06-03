"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, companies, jobs, jobSubmissions } from "@/db";
import { submissionSchema } from "@/lib/submission-schema";
import { buildJobPostingJsonLd } from "@/lib/job-json-ld";
import { resolveLocation } from "@/lib/post-schema";
import { firstParagraph } from "@/lib/format";
import { slugify } from "@/lib/utils";
import { monogram, logoColors } from "@/lib/logo";
import { getAdminSession } from "@/lib/admin";

export type AdminResult = { ok: true } | { ok: false; error: string };

/** Finds a free job slug, suffixing `-2`, `-3`, … on collision. */
async function uniqueJobSlug(base: string): Promise<string> {
  let slug = base || "role";
  let n = 2;
  for (;;) {
    const hit = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.slug, slug))
      .limit(1);
    if (hit.length === 0) return slug;
    slug = `${base}-${n++}`;
  }
}

/**
 * Publish a pending submission: build (or reuse) the company, insert the
 * live job with precomputed JobPosting JSON-LD, and mark the submission
 * published. Only then does the role appear anywhere on the public surface.
 */
export async function publishSubmission(id: string): Promise<AdminResult> {
  const admin = await getAdminSession();
  if (!admin) return { ok: false, error: "Not authorized." };

  try {
    const [sub] = await db
      .select()
      .from(jobSubmissions)
      .where(eq(jobSubmissions.id, id))
      .limit(1);
    if (!sub) return { ok: false, error: "Submission not found." };
    if (sub.status !== "pending")
      return { ok: false, error: `Already ${sub.status}.` };

    const parsed = submissionSchema.safeParse(sub.data);
    if (!parsed.success)
      return { ok: false, error: "Submission payload is invalid." };
    const f = parsed.data;

    // Paid posts (from /post) carry a `_meta` marker; publish them as a
    // featured listing for the paid window. Free /submit posts have no meta.
    const meta = (sub.data as { _meta?: { kind?: string; weeks?: number } })
      ._meta;
    const isPaid = meta?.kind === "paid";
    const featuredUntil = isPaid
      ? new Date(Date.now() + (meta?.weeks ?? 1) * 7 * 86_400_000)
      : null;

    // 1. Company — reuse by slug, else create with an auto-derived lockup.
    const companySlug = slugify(f.companyName);
    let companyId: string;
    let companyName: string;
    let companyWebsite: string | null;
    let companyVerified: boolean;

    const [existing] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, companySlug))
      .limit(1);

    if (existing) {
      companyId = existing.id;
      companyName = existing.name;
      companyWebsite = existing.website;
      companyVerified = existing.verified;
    } else {
      const { bg, fg } = logoColors(f.companyName);
      const [created] = await db
        .insert(companies)
        .values({
          slug: companySlug,
          name: f.companyName,
          logoText: monogram(f.companyName),
          logoBg: bg,
          logoFg: fg,
          ecosystems: f.ecosystems,
          website: f.companyWebsite || null,
          verified: false,
        })
        .returning();
      companyId = created.id;
      companyName = created.name;
      companyWebsite = created.website;
      companyVerified = false;
    }

    // 2. Job row.
    const slug = await uniqueJobSlug(`${slugify(f.title)}-${companySlug}`);
    const { location, remoteScope } = resolveLocation(f.location);
    const postedAt = new Date();
    const salaryMin = f.salaryMin ? Number(f.salaryMin) : 0;
    const salaryMax = f.salaryMax ? Number(f.salaryMax) : 0;

    const jsonLd = buildJobPostingJsonLd({
      title: f.title,
      description: f.descriptionMd,
      slug,
      postedAt,
      employmentType: f.employmentType,
      remoteScope,
      location,
      salaryMin,
      salaryMax,
      salaryCurrency: f.salaryCurrency,
      company: { name: companyName, website: companyWebsite },
    });

    const [inserted] = await db
      .insert(jobs)
      .values({
        slug,
        companyId,
        title: f.title,
        descriptionMd: f.descriptionMd,
        oneLiner: firstParagraph(f.descriptionMd).slice(0, 160),
        roleCategory: f.roleCategory,
        seniority: f.seniority,
        employmentType: f.employmentType,
        location,
        remoteScope,
        salaryMin,
        salaryMax,
        salaryCurrency: f.salaryCurrency,
        hasTokenEquity: f.hasTokenEquity,
        ecosystems: f.ecosystems,
        isVerified: companyVerified,
        isFeatured: isPaid,
        featuredUntil,
        applyUrl: f.applyUrl || null,
        applyEmail: f.applyEmail || null,
        source: isPaid ? "paid" : "community",
        jsonLd,
        postedAt,
      })
      .returning({ id: jobs.id });

    // 3. Mark the submission published.
    await db
      .update(jobSubmissions)
      .set({
        status: "published",
        publishedJobId: inserted.id,
        reviewedAt: new Date(),
      })
      .where(eq(jobSubmissions.id, id));

    revalidatePath("/");
    revalidatePath("/jobs");
    revalidatePath("/admin/submissions");
    return { ok: true };
  } catch (err) {
    console.error("publishSubmission failed:", err);
    return { ok: false, error: "Something went wrong publishing." };
  }
}

/** Reject a pending submission — leaves the live board untouched. */
export async function rejectSubmission(id: string): Promise<AdminResult> {
  const admin = await getAdminSession();
  if (!admin) return { ok: false, error: "Not authorized." };
  try {
    await db
      .update(jobSubmissions)
      .set({ status: "rejected", reviewedAt: new Date() })
      .where(eq(jobSubmissions.id, id));
    revalidatePath("/admin/submissions");
    return { ok: true };
  } catch (err) {
    console.error("rejectSubmission failed:", err);
    return { ok: false, error: "Something went wrong." };
  }
}
