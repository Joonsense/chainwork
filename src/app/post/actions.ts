"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, companies, jobs } from "@/db";
import { postFormSchema, resolveLocation } from "@/lib/post-schema";
import { buildJobPostingJsonLd } from "@/lib/job-json-ld";
import { firstParagraph } from "@/lib/format";
import { slugify } from "@/lib/utils";

export type SubmitResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

const cleanList = (rows: { value: string }[]): string[] =>
  rows.map((r) => r.value.trim()).filter(Boolean);

/** Finds a free job slug, suffixing `-2`, `-3`, … on collision. */
async function uniqueJobSlug(base: string): Promise<string> {
  let slug = base;
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
 * Inserts a job (and its company, if new) from the /post wizard.
 *
 * Admin-gated: the caller passes the same token the page was opened with,
 * and it is re-checked here — server actions are public POST endpoints, so
 * the page-level gate alone is not enough. Real auth lands in P8.
 */
export async function submitJob(args: {
  token: string;
  data: unknown;
}): Promise<SubmitResult> {
  const adminToken = process.env.ADMIN_POST_TOKEN;
  if (!adminToken || args.token !== adminToken) {
    return { ok: false, error: "Unauthorized." };
  }

  // Never trust the client — re-validate the whole payload server-side.
  const parsed = postFormSchema.safeParse(args.data);
  if (!parsed.success) {
    return { ok: false, error: "Some fields are invalid. Review and retry." };
  }
  const f = parsed.data;

  try {
    // 1. Resolve the company — an existing row, or a freshly inserted one.
    let companyId: string;
    let companySlug: string;
    let companyName: string;
    let companyWebsite: string | null;
    let companyVerified: boolean;

    if (f.companyMode === "existing") {
      const [existing] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, f.companyId))
        .limit(1);
      if (!existing) {
        return { ok: false, error: "That company no longer exists." };
      }
      companyId = existing.id;
      companySlug = existing.slug;
      companyName = existing.name;
      companyWebsite = existing.website;
      companyVerified = existing.verified;
    } else {
      const dupe = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.slug, f.slug))
        .limit(1);
      if (dupe.length > 0) {
        return {
          ok: false,
          error: `A company with the slug "${f.slug}" already exists. Pick a different slug, or add it as an existing company.`,
        };
      }
      const [created] = await db
        .insert(companies)
        .values({
          slug: f.slug,
          name: f.name.trim(),
          logoText: f.logoText.trim().toUpperCase(),
          logoBg: f.logoBg,
          logoFg: f.logoFg,
          stage: f.stage,
          size: f.size.trim(),
          focus: f.oneLiner.trim() || null,
          hq: f.hq.trim() || null,
          ecosystems: f.companyEcosystems,
          website: f.website.trim() || null,
          verified: false,
        })
        .returning();
      companyId = created.id;
      companySlug = created.slug;
      companyName = created.name;
      companyWebsite = created.website;
      companyVerified = false;
    }

    // 2. Assemble the job row.
    const slug = await uniqueJobSlug(`${slugify(f.title)}-${companySlug}`);
    const { location, remoteScope } = resolveLocation(f.location);
    const postedAt = new Date();
    const salaryMin = Number(f.salaryMin);
    const salaryMax = Number(f.salaryMax);
    const title = f.title.trim();
    const descriptionMd = f.descriptionMd.trim();

    const jsonLd = buildJobPostingJsonLd({
      title,
      descriptionMd,
      slug,
      postedAt,
      employmentType: f.employmentType,
      remoteScope,
      salaryMin,
      salaryMax,
      salaryCurrency: f.salaryCurrency,
      company: { name: companyName, website: companyWebsite },
    });

    await db.insert(jobs).values({
      slug,
      companyId,
      title,
      descriptionMd,
      responsibilities: cleanList(f.responsibilities),
      requirements: cleanList(f.requirements),
      niceToHave: cleanList(f.niceToHave),
      oneLiner: firstParagraph(descriptionMd).slice(0, 160),
      roleCategory: f.roleCategory,
      seniority: f.seniority,
      employmentType: f.employmentType,
      location,
      remoteScope,
      salaryMin,
      salaryMax,
      salaryCurrency: f.salaryCurrency,
      hasTokenEquity: f.hasTokenEquity,
      ecosystems: f.jobEcosystems,
      skills: cleanList(f.skills),
      isFeatured: f.isFeatured,
      isSponsored: false,
      isVerified: companyVerified,
      applyUrl: f.applyUrl.trim() || null,
      applyEmail: f.applyEmail.trim() || null,
      jsonLd,
      postedAt,
    });

    // Home and /jobs are force-dynamic, but revalidate is correct intent.
    revalidatePath("/");
    revalidatePath("/jobs");
    return { ok: true, slug };
  } catch (err) {
    console.error("submitJob failed:", err);
    return {
      ok: false,
      error: "Something went wrong saving the job. Try again.",
    };
  }
}
