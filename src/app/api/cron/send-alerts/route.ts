import { type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { runAlertDigest } from "@/lib/alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Daily cron (09:00 UTC) — sends the daily/weekly job-alert digests.
 * Manually triggerable for QA: /api/cron/send-alerts?key=<CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await runAlertDigest();
  console.log(`send-alerts: sent ${result.sent}, skipped ${result.skipped}`);
  return Response.json({ ok: true, ...result });
}
