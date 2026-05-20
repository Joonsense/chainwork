import { type NextRequest } from "next/server";

/**
 * Guards `/api/cron/*` endpoints. Accepts either Vercel Cron's
 * `Authorization: Bearer <CRON_SECRET>` header, or a `?key=` query
 * param for manual triggering during QA.
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return req.nextUrl.searchParams.get("key") === secret;
}
