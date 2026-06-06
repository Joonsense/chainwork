"use server";

import { eq } from "drizzle-orm";
import { db, jobSubmissions } from "@/db";
import {
  submissionSchema,
  leanSubmissionSchema,
  normalizeUrl,
  SUBMISSION_MIN_DESCRIPTION,
  type SubmissionForm,
} from "@/lib/submission-schema";
import { importJobFromUrl, type ImportResult } from "@/lib/ats/import-url";
import { POST_WEEK_OPTIONS } from "@/lib/post-schema";
import { APP_URL } from "@/lib/site";
import { stripe, stripeEnabled, POST_PRICE_CENTS } from "@/lib/stripe";
import {
  createInvoice as createNowPaymentsInvoice,
  nowpaymentsEnabled,
  POST_PRICE_USD,
} from "@/lib/nowpayments";

export type SubmitResult = { ok: true } | { ok: false; error: string };

export type PaidPostResult =
  | { ok: true; checkoutUrl?: string }
  | { ok: false; error: string };

/** Marker stored on a paid post's `data._meta` (no schema migration needed). */
export type PaidPostMeta = {
  kind: "paid";
  weeks: number;
  paid: boolean;
  paidAt?: string;
};

/**
 * Pre-fill the submission form from a pasted Greenhouse / Lever / Ashby job
 * link. Runs server-side (the ATS APIs need a server fetch, not the browser).
 * Returns the lean form fields; the client merges them into the form.
 */
export async function importFromUrl(url: string): Promise<ImportResult> {
  if (typeof url !== "string" || url.trim().length === 0) {
    return { ok: false, error: "Paste a job link first." };
  }
  return importJobFromUrl(url);
}

/**
 * Public job submission — no auth. The payload lands in `job_submissions`
 * with status "pending" and never touches the live `jobs` table until an
 * admin publishes it from /admin/submissions. Server re-validates the whole
 * payload — server actions are public POST endpoints, so the client schema
 * alone is not enough.
 */
export async function createSubmission(args: {
  data: unknown;
}): Promise<SubmitResult> {
  const parsed = submissionSchema.safeParse(args.data);
  if (!parsed.success) {
    return { ok: false, error: "Some fields are invalid. Review and retry." };
  }
  const f = parsed.data;

  try {
    await db.insert(jobSubmissions).values({
      status: "pending",
      submitterEmail: f.submitterEmail.trim().toLowerCase(),
      data: {
        ...f,
        companyWebsite: normalizeUrl(f.companyWebsite),
        applyUrl: normalizeUrl(f.applyUrl),
      },
      note: f.note.trim() || null,
    });
    return { ok: true };
  } catch (err) {
    console.error("createSubmission failed:", err);
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

/**
 * Fill blanks on a lean paid post from its ATS apply link. Only runs when the
 * description is thin and the apply URL is a Greenhouse/Lever/Ashby link; only
 * fills fields the poster left empty (never overwrites what they typed).
 * Returns the input untouched on any miss — enrichment is best-effort.
 */
async function enrichFromApply(f: SubmissionForm): Promise<SubmissionForm> {
  const thin = f.descriptionMd.trim().length < SUBMISSION_MIN_DESCRIPTION;
  if (!f.applyUrl || !thin) return f;

  let imported;
  try {
    imported = await importJobFromUrl(normalizeUrl(f.applyUrl));
  } catch {
    return f;
  }
  if (!imported.ok) return f;
  const x = imported.fields;

  return {
    ...f,
    descriptionMd: f.descriptionMd.trim() ? f.descriptionMd : x.descriptionMd ?? f.descriptionMd,
    roleCategory: f.roleCategory || (x.roleCategory ?? f.roleCategory),
    ecosystems: f.ecosystems.length ? f.ecosystems : x.ecosystems ?? f.ecosystems,
    location: f.location || (x.location ?? f.location),
    salaryMin: f.salaryMin || (x.salaryMin ?? f.salaryMin),
    salaryMax: f.salaryMax || (x.salaryMax ?? f.salaryMax),
  };
}

/**
 * Paid "post a job" ($150 / 1 week). No login — payment is the gate.
 *
 * Stores the same submission payload as the free flow, tagged with a paid
 * `_meta` marker, then hands the buyer a hosted checkout (NowPayments crypto
 * first, Stripe card fallback). The webhook flips `_meta.paid` on success;
 * an admin still publishes from the queue (light review), at which point the
 * role goes live as a featured listing for the paid window.
 *
 * Dev fallback: with no payment rail wired, the post is marked paid
 * immediately so the queue flow is testable.
 */
export async function createPaidPost(args: {
  data: unknown;
  weeks?: number;
}): Promise<PaidPostResult> {
  // Lean gate: only email/company/title/apply are required; payment is the
  // real gate. We complete the rest below.
  const parsed = leanSubmissionSchema.safeParse(args.data);
  if (!parsed.success) {
    return { ok: false, error: "Some fields are invalid. Review and retry." };
  }
  // "Pay, and we fill it in": when the poster left the listing thin and gave
  // an ATS apply link, pull the full posting from the public feed and fill
  // only the fields they left blank. Best-effort — never blocks checkout.
  const f = await enrichFromApply(parsed.data);
  const paymentEnabled = nowpaymentsEnabled || stripeEnabled;

  // Whole-week durations only; price scales linearly at $150/week.
  const weeks = (POST_WEEK_OPTIONS as readonly number[]).includes(
    args.weeks ?? 1,
  )
    ? (args.weeks as number)
    : 1;
  const priceUsd = POST_PRICE_USD * weeks;
  const priceCents = POST_PRICE_CENTS * weeks;

  const meta: PaidPostMeta = {
    kind: "paid",
    weeks,
    // Dev fallback: no rail wired -> treat as paid so the queue is testable.
    paid: !paymentEnabled,
    ...(!paymentEnabled ? { paidAt: new Date().toISOString() } : {}),
  };

  try {
    const [row] = await db
      .insert(jobSubmissions)
      .values({
        status: "pending",
        submitterEmail: f.submitterEmail.trim().toLowerCase(),
        data: {
          ...f,
          companyWebsite: normalizeUrl(f.companyWebsite),
          applyUrl: normalizeUrl(f.applyUrl),
          _meta: meta,
        },
        note: f.note.trim() || null,
      })
      .returning({ id: jobSubmissions.id });

    if (!paymentEnabled) return { ok: true };

    const orderId = `paidpost:${row.id}`;
    const successUrl = `${APP_URL}/post/success?status=paid`;
    const cancelUrl = `${APP_URL}/post/success?status=cancelled`;
    const weekLabel = `${weeks} week${weeks > 1 ? "s" : ""}`;
    const description = `Chainwork featured job post (${weekLabel}): ${f.title} at ${f.companyName}`;

    if (nowpaymentsEnabled) {
      const invoice = await createNowPaymentsInvoice({
        priceUsd,
        orderId,
        description,
        successUrl,
        cancelUrl,
        ipnCallbackUrl: `${APP_URL}/api/payments/nowpayments-webhook`,
      });
      return { ok: true, checkoutUrl: invoice.invoiceUrl };
    }

    const checkout = await stripe!.checkout.sessions.create({
      mode: "payment",
      customer_email: f.submitterEmail.trim().toLowerCase(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: priceCents,
            product_data: {
              name: `Chainwork featured job post (${weekLabel})`,
              description,
            },
          },
        },
      ],
      metadata: { submissionId: row.id, kind: "paidpost", weeks: String(weeks) },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    if (!checkout.url) throw new Error("Stripe did not return a checkout URL");
    return { ok: true, checkoutUrl: checkout.url };
  } catch (err) {
    console.error("createPaidPost failed:", err);
    return { ok: false, error: "Couldn't start checkout. Try again." };
  }
}

/** Flip a paid post's `_meta.paid` flag on payment-webhook success. */
export async function markPaidPostPaid(submissionId: string): Promise<void> {
  const [sub] = await db
    .select({ data: jobSubmissions.data })
    .from(jobSubmissions)
    .where(eq(jobSubmissions.id, submissionId))
    .limit(1);
  if (!sub) return;
  const data = (sub.data ?? {}) as Record<string, unknown>;
  const meta = (data._meta ?? {}) as PaidPostMeta;
  data._meta = { ...meta, paid: true, paidAt: new Date().toISOString() };
  await db
    .update(jobSubmissions)
    .set({ data })
    .where(eq(jobSubmissions.id, submissionId));
}
