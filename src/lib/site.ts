/**
 * Canonical site origin — the absolute base for llms.txt, the sitemap,
 * robots.txt, and the per-role markdown.
 *
 * Override with `NEXT_PUBLIC_SITE_URL`. On Vercel it falls back to the
 * production deployment URL; locally it falls back to the spec placeholder.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "https://chainwork.xx";
}

export const SITE_URL = resolveSiteUrl();

/**
 * The origin the app is actually served from — used for absolute links
 * in emails, Stripe redirect URLs, and alert confirmation links.
 * `BETTER_AUTH_URL` is the authoritative running-app URL.
 */
export const APP_URL = (
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
