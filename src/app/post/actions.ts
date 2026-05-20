"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db, companies, jobs, type Company } from "@/db";
import { postFormSchema, resolveLocation } from "@/lib/post-schema";
import { buildJobPostingJsonLd } from "@/lib/job-json-ld";
import { firstParagraph } from "@/lib/format";
import { slugify } from "@/lib/utils";
import { getServerSession } from "@/lib/auth";
import { APP_URL } from "@/lib/site";
import { stripe, stripeEnabled, FEATURED_PRICE_CENTS } from "@/lib/stripe";
import { sendRealtimeAlertsForJob } from "@/lib/alerts";
import type { JobWithCompany } from "@/db/queries";

export type SubmitResult =
  | { ok: true; slug: string; checkoutUrl?: string }
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

/** Stripe Checkout for a Featured slot — $199, charged before the slot is granted. */
async function createFeaturedCheckout(job: {
  id: string;
  slug: string;
  title: string;
}): Promise<string> {
  const checkout = await stripe!.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: FEATURED_PRICE_CENTS,
          product_data: {
            name: "Featured role slot — 2 weeks",
            description: job.title,
          },
        },
      },
    ],
    metadata: { jobId: job.id, kind: "featured" },
    success_url: `${APP_URL}/post/success?slug=${job.slug}&featured=paid`,
    cancel_url: `${APP_URL}/post/success?slug=${job.slug}&featured=cancelled`,
  });
  if (!checkout.url) throw new Error("Stripe did not return a checkout URL");
  return checkout.url;
}

/**
 * Inserts a job (and its company, if new) from the /post wizard.
 *
 * The session is re-checked here — server actions are public POST
 * endpoints, so the page guard alone is not enough.
 *
 * Featured: with Stripe wired, the job is saved un-featured and the
 * caller is sent to Checkout; the webhook flips `is_featured` on payment.
 * Without Stripe, the slot is granted directly (dev fallback).
 */
export async function submitJob(args: {
  data: unknown;
}): Promise<SubmitResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, error: "You must be signed in to post a role." };
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
    let company: Company;

    if (f.companyMode === "existing") {
      const [existing] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, f.companyId))
        .limit(1);
      if (!existing) {
        return { ok: false, error: "That company no longer exists." };
      }
      company = existing;
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
      company = created;
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

    // Featured: pay-then-grant when Stripe is wired; granted now otherwise.
    const wantsFeatured = f.isFeatured;
    const grantNow = wantsFeatured && !stripeEnabled;

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

    const [inserted] = await db
      .insert(jobs)
      .values({
        slug,
        companyId,
        postedBy: session.user.id,
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
        isFeatured: grantNow,
        featuredUntil: grantNow
          ? new Date(Date.now() + 14 * 86_400_000)
          : null,
        isSponsored: false,
        isVerified: companyVerified,
        applyUrl: f.applyUrl.trim() || null,
        applyEmail: f.applyEmail.trim() || null,
        jsonLd,
        postedAt,
      })
      .returning();

    // Realtime job alerts — fire after the response so the user is not
    // blocked on email delivery.
    after(async () => {
      await sendRealtimeAlertsForJob({
        ...inserted,
        company,
      } as JobWithCompany);
    });

    revalidatePath("/");
    revalidatePath("/jobs");

    // Paid Featured path → hand off to Stripe Checkout.
    if (wantsFeatured && stripeEnabled) {
      const checkoutUrl = await createFeaturedCheckout({
        id: inserted.id,
        slug,
        title,
      });
      return { ok: true, slug, checkoutUrl };
    }

    return { ok: true, slug };
  } catch (err) {
    console.error("submitJob failed:", err);
    return {
      ok: false,
      error: "Something went wrong saving the job. Try again.",
    };
  }
}
