import { type NextRequest } from "next/server";
import { searchJobs } from "@/db/queries";
import {
  SALARY_MIN,
  SALARY_MAX,
  type JobFilters,
} from "@/lib/jobs-search-params";
import { CORS_HEADERS, clientIp, rateLimit } from "@/lib/api";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;

/** Comma-separated query param → trimmed, non-empty values. */
function csv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function intParam(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * `GET /api/jobs` — public, CORS-open, rate-limited job feed.
 *
 * Returns a JSON array of jobs (company embedded, JSON-LD on every row).
 * Pagination total is surfaced in the `X-Total-Count` header so the body
 * stays a clean array. Params: ?limit=50&offset=0&eco=&role=&min=
 * (`min` is in $thousands, matching the /jobs filters).
 */
export async function GET(req: NextRequest) {
  const limited = rateLimit(clientIp(req));
  const rateHeaders = {
    "X-RateLimit-Limit": String(limited.limit),
    "X-RateLimit-Remaining": String(limited.remaining),
  };

  if (!limited.ok) {
    const retryAfter = Math.ceil((limited.resetAt - Date.now()) / 1000);
    return Response.json(
      { error: "Rate limit exceeded — 600 requests per minute per IP." },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          ...rateHeaders,
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(intParam(sp.get("limit"), 50), 1), MAX_LIMIT);
  const offset = Math.max(intParam(sp.get("offset"), 0), 0);

  const filters: JobFilters = {
    q: "",
    eco: csv(sp.get("eco")),
    role: csv(sp.get("role")),
    seniority: [],
    loc: [],
    min: intParam(sp.get("min"), SALARY_MIN),
    max: SALARY_MAX,
    token: false,
    posted: "all",
    sort: "newest",
  };

  const { jobs, total } = await searchJobs(filters, { limit, offset });

  return Response.json(jobs, {
    headers: {
      ...CORS_HEADERS,
      ...rateHeaders,
      "X-Total-Count": String(total),
      "Cache-Control": "s-maxage=60, stale-while-revalidate",
    },
  });
}

/** CORS preflight. */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
