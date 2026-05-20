import { getServerSession } from "@/lib/auth";
import { getSavedJobSlugs } from "@/db/queries";

export const dynamic = "force-dynamic";

/** The signed-in user's saved job slugs (P9) — hydrates the bookmarks. */
export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return Response.json({ authed: false, slugs: [] });
  }
  const slugs = await getSavedJobSlugs(session.user.id);
  return Response.json({ authed: true, slugs });
}
