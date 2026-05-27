import crypto from "crypto";

/**
 * NowPayments (P14) — crypto checkout for Featured slots.
 *
 * `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET` must both be set
 * for the integration to be active. When either is missing, the
 * Featured path falls back to Stripe (if wired) or the dev grant.
 *
 * Pricing is in USD; NowPayments quotes the buyer in their chosen
 * token (BTC, ETH, USDC, SOL, USDT, and ~200 more) at invoice time.
 */

const NP_BASE = "https://api.nowpayments.io/v1";

export const nowpaymentsEnabled = Boolean(
  process.env.NOWPAYMENTS_API_KEY && process.env.NOWPAYMENTS_IPN_SECRET,
);

/** Featured slot — price (USD) and length, mirrors the Stripe wrapper. */
export const FEATURED_PRICE_USD = 199;
export const FEATURED_DAYS = 14;

export interface InvoiceInput {
  priceUsd: number;
  orderId: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  ipnCallbackUrl: string;
}

export interface InvoiceResult {
  id: string;
  invoiceUrl: string;
}

/** Creates a hosted NowPayments invoice; the caller redirects the buyer to `invoiceUrl`. */
export async function createInvoice(
  input: InvoiceInput,
): Promise<InvoiceResult> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error("NOWPAYMENTS_API_KEY not set");

  const res = await fetch(`${NP_BASE}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: input.priceUsd,
      price_currency: "usd",
      order_id: input.orderId,
      order_description: input.description,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      ipn_callback_url: input.ipnCallbackUrl,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `NowPayments invoice failed: ${res.status} ${errText.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as { id: string | number; invoice_url: string };
  return { id: String(data.id), invoiceUrl: data.invoice_url };
}

/**
 * Recursively sort object keys alphabetically — required for IPN signature
 * verification per NowPayments docs (the signature is HMAC-SHA512 over the
 * canonicalised JSON, not the raw body).
 */
function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortObjectKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

/** HMAC-SHA512 of the sorted JSON body, compared in constant time. */
export function verifyIpnSignature(
  rawBody: string,
  signature: string,
): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const sorted = JSON.stringify(sortObjectKeys(parsed));
  const expected = crypto
    .createHmac("sha512", secret)
    .update(sorted)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/** Payment is fully settled per NowPayments' status taxonomy. */
export function isFinalSuccess(status: string): boolean {
  return status === "finished" || status === "confirmed";
}
