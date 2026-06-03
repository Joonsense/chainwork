import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, jobs } from "@/db";
import {
  FEATURED_DAYS,
  isFinalSuccess,
  nowpaymentsEnabled,
  verifyIpnSignature,
} from "@/lib/nowpayments";
import { markPaidPostPaid } from "@/app/submit/actions";

export const dynamic = "force-dynamic";

/**
 * NowPayments IPN webhook (P14). On a final-success payment status
 * (`finished` or `confirmed`) for a Featured purchase, flips the job
 * to featured for the next 14 days — same effect as the Stripe webhook,
 * different payment rail.
 *
 * The order_id encodes both the kind and the job UUID:
 *   featured:<jobId>
 *
 * The signature is verified against the raw request body using
 * HMAC-SHA512, so the body must be read with `req.text()` (never
 * parsed first).
 */
export async function POST(req: NextRequest) {
  if (!nowpaymentsEnabled) {
    return new Response("NowPayments is not configured", { status: 503 });
  }

  const signature = req.headers.get("x-nowpayments-sig");
  if (!signature) {
    return new Response("Missing x-nowpayments-sig header", { status: 400 });
  }

  const rawBody = await req.text();

  if (!verifyIpnSignature(rawBody, signature)) {
    console.warn("NowPayments IPN: invalid signature");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    payment_status?: string;
    order_id?: string;
  };

  // Acknowledge intermediate states (waiting, confirming, sending) without acting.
  if (!event.payment_status || !isFinalSuccess(event.payment_status)) {
    return Response.json({
      received: true,
      status: event.payment_status ?? "unknown",
    });
  }

  const orderId = String(event.order_id ?? "");
  const sep = orderId.indexOf(":");
  if (sep < 0) {
    console.warn(`NowPayments IPN: malformed order_id "${orderId}"`);
    return Response.json({ received: true, error: "malformed order_id" });
  }
  const kind = orderId.slice(0, sep);
  const id = orderId.slice(sep + 1);

  if (kind === "featured" && id) {
    await db
      .update(jobs)
      .set({
        isFeatured: true,
        featuredUntil: new Date(Date.now() + FEATURED_DAYS * 86_400_000),
      })
      .where(eq(jobs.id, id));
    console.log(`NowPayments: Featured slot activated for job ${id}`);
  } else if (kind === "paidpost" && id) {
    await markPaidPostPaid(id);
    console.log(`NowPayments: paid post ${id} marked paid`);
  }

  return Response.json({ received: true });
}
