import { type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { runATSIngest } from "@/lib/ats/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // ATS fetches can be slow

/**
 * Daily cron (06:00 UTC) — fetches fresh jobs from Greenhouse + Lever
 * for all registered crypto companies and upserts them to the DB.
 *
 * Manually triggerable: GET /api/cron/ingest-jobs?key=<CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[ingest-jobs] Starting ATS ingest...");
  const result = await runATSIngest();
  console.log("[ingest-jobs] Done:", result);

  return Response.json({ ok: true, ...result });
}
