import { type NextRequest } from "next/server";
import { searchPalette } from "@/db/queries";

/** Command-palette search — top jobs, companies, inferred ecosystems. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const data = await searchPalette(q);
  return Response.json(data);
}
