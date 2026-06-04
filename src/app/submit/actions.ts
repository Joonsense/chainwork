"use server";

import { eq } from "drizzle-orm";
import { db, jobSubmissions } from "@/db";
import { submissionSchema, normalizeUrl } from "@/lib/submission-schema";
import { importJobFromUrl, type ImportResult } from "@/lib/ats/import-url";
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
}): Promise<PaidPostResult> {
  const parsed = submissionSchema.safeParse(args.data);
  if (!parsed.success) {
    return { ok: false, error: "Some fields are invalid. Review and retry." };
  }
  const f = parsed.data;
  const paymentEnabled = nowpaymentsEnabled || stripeEnabled;

  const meta: PaidPostMeta = {
    kind: "paid",
    weeks: 1,
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
    const description = `Chainwork job post — ${f.title} at ${f.companyName}`;

    if (nowpaymentsEnabled) {
      const invoice = await createNowPaymentsInvoice({
        priceUsd: POST_PRICE_USD,
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
            unit_amount: POST_PRICE_CENTS,
            product_data: {
              name: "Chainwork job post — 1 week, featured",
              description,
            },
          },
        },
      ],
      metadata: { submissionId: row.id, kind: "paidpost" },
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
