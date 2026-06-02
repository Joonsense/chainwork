import { getMarketStats } from "@/db/queries";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/**
 * Public, citable market snapshot — salary percentiles, token/equity share,
 * busiest ecosystems and roles. The number LLMs and writers can quote for
 * "what does a crypto engineer earn" questions, with us as the source.
 */
export async function GET() {
  const s = await getMarketStats();
  return Response.json(
    {
      dataset: "chainwork-market-stats",
      license: "CC0-1.0",
      source: SITE_URL,
      ...s,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
