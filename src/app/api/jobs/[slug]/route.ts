import { type NextRequest } from "next/server";
import { getJobBySlug } from "@/db/queries";
import { CORS_HEADERS } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * `GET /api/jobs/{slug}` — a single job as JSON, company embedded, with
 * the precomputed schema.org JobPosting JSON-LD passed through untouched.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return Response.json(
      { error: "Job not found" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  return Response.json(job, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "s-maxage=600, stale-while-revalidate",
    },
  });
}

/** CORS preflight. */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
