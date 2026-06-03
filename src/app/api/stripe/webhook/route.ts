import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, jobs } from "@/db";
import { stripe, FEATURED_DAYS } from "@/lib/stripe";
import { markPaidPostPaid } from "@/app/submit/actions";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook (P9). On `checkout.session.completed` for a Featured
 * purchase, flips the job to featured for the next 14 days.
 *
 * The signature is verified against the raw request body, so the body
 * must be read with `req.text()` (never parsed first).
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return new Response("Stripe is not configured", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object;
    const md = checkout.metadata ?? {};
    if (md.kind === "featured" && md.jobId) {
      await db
        .update(jobs)
        .set({
          isFeatured: true,
          featuredUntil: new Date(Date.now() + FEATURED_DAYS * 86_400_000),
        })
        .where(eq(jobs.id, md.jobId));
      console.log(`Featured slot activated for job ${md.jobId}`);
    } else if (md.kind === "paidpost" && md.submissionId) {
      await markPaidPostPaid(md.submissionId);
      console.log(`Paid post ${md.submissionId} marked paid (stripe)`);
    }
  }

  return Response.json({ received: true });
}
