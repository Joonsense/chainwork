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
