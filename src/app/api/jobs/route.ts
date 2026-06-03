import { type NextRequest } from "next/server";
import { searchJobs } from "@/db/queries";
import { SALARY_MAX, type JobFilters } from "@/lib/jobs-search-params";
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

/**
 * Parse an integer query param. An absent (`null`) or blank param falls back —
 * note `Number(null)` and `Number("")` are both `0` (finite), so we must guard
 * those explicitly or every default collapses to 0. Floats are truncated.
 */
function intParam(value: string | null, fallback: number): number {
  if (value === null || value.trim() === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/**
 * `GET /api/jobs` — public, CORS-open, rate-limited job feed.
 *
 * Returns a JSON array of jobs (company embedded, JSON-LD on every row).
 * Pagination total is always surfaced in the `X-Total-Count` header so the
 * default body stays a clean array. Pass `?meta=1` to get an envelope instead:
 * `{ data, total, limit, offset }`.
 *
 * Params: ?limit=50&offset=0&meta=&eco=&role=&min=
 *   - limit:  default 50, clamped to 1..100
 *   - offset: default 0
 *   - min:    floor salary in $thousands; default 0 (the feed returns the full
 *             registry — unlike the /jobs UI, which defaults the slider to 120).
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
    company: sp.get("company")?.trim() ?? "",
    eco: csv(sp.get("eco")),
    role: csv(sp.get("role")),
    seniority: [],
    loc: [],
    // Default 0 (not SALARY_MIN): the API is the full registry feed; only
    // filter by salary when the caller explicitly asks.
    min: intParam(sp.get("min"), 0),
    max: SALARY_MAX,
    token: false,
    posted: "all",
    sort: "newest",
  };

  const { jobs, total } = await searchJobs(filters, { limit, offset });

  // Opt-in envelope keeps the default array response backward-compatible for
  // existing consumers while giving agents inline pagination metadata.
  const wantMeta = sp.get("meta") === "1" || sp.get("meta") === "true";
  const body = wantMeta ? { data: jobs, total, limit, offset } : jobs;

  return Response.json(body, {
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
