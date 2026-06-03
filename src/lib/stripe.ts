import Stripe from "stripe";

/**
 * Stripe client (P9). Featured-slot checkout — $199 for a 2-week slot.
 *
 * When STRIPE_SECRET_KEY is unset, `stripe` is null and the Featured
 * toggle grants the slot directly (dev fallback). Stripe MUST be wired
 * in production, otherwise Featured slots are free.
 */
const key = process.env.STRIPE_SECRET_KEY;

export const stripeEnabled = Boolean(key);

export const stripe = key ? new Stripe(key) : null;

/** Featured slot — price (USD cents) and length. */
export const FEATURED_PRICE_CENTS = 19_900;
export const FEATURED_DAYS = 14;

/** Paid "post a job" — $150 for a 1-week (7-day) featured listing. */
export const POST_PRICE_CENTS = 15_000;
export const POST_DAYS = 7;
