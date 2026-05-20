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
