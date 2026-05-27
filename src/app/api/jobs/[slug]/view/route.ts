import { type NextRequest } from "next/server";
import { incrementViewCount } from "@/db/queries";

export const dynamic = "force-dynamic";

/**
 * POST /api/jobs/[slug]/view
 * Increments the view_count for a job. Called client-side on page load.
 * Fire-and-forget — no auth required, no rate-limiting (low-value endpoint).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) return new Response("Missing slug", { status: 400 });
  // Non-blocking — don't await in catch path
  try {
    await incrementViewCount(slug);
  } catch {
    // Silently ignore — view counts are best-effort
  }
  return new Response(null, { status: 204 });
}
