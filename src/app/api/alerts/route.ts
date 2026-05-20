import { type NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, jobAlerts } from "@/db";
import { getServerSession } from "@/lib/auth";
import { sendAlertConfirmEmail } from "@/lib/email";
import { normalizeFilters, ALERT_FREQUENCIES } from "@/lib/alerts";
import { APP_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHANNELS = ["email", "telegram", "webhook"];

/** Subscribe to a job alert (P9). Open to anyone — double opt-in by email. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const freqRaw = String(body.frequency ?? "");
  const frequency = (ALERT_FREQUENCIES as readonly string[]).includes(freqRaw)
    ? freqRaw
    : "daily";
  const channels: string[] = Array.isArray(body.channels)
    ? body.channels.filter(
        (c: unknown) => typeof c === "string" && CHANNELS.includes(c),
      )
    : [];
  const filters = normalizeFilters(body.filters);

  const session = await getServerSession();
  const token = crypto.randomUUID();

  await db.insert(jobAlerts).values({
    email,
    userId: session?.user.id ?? null,
    query: filters.q || null,
    filters,
    frequency,
    channels: channels.length ? channels : ["email"],
    verified: false,
    token,
  });

  try {
    await sendAlertConfirmEmail(email, `${APP_URL}/alerts/confirm/${token}`);
  } catch (err) {
    // The row exists; surface a soft warning but still report success.
    console.error("alert confirm email failed:", err);
  }

  return Response.json({ ok: true });
}

/** The signed-in user's own alerts. */
export async function GET() {
  const session = await getServerSession();
  if (!session) return Response.json({ alerts: [] });
  const alerts = await db
    .select()
    .from(jobAlerts)
    .where(eq(jobAlerts.userId, session.user.id))
    .orderBy(desc(jobAlerts.createdAt));
  return Response.json({ alerts });
}
