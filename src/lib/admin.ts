import { getServerSession } from "@/lib/auth";

/**
 * Admin gate. There is no role column — admins are an allowlist of emails
 * in `ADMIN_EMAILS` (comma-separated). Falls back to the founder's address
 * so the moderation queue is reachable on first deploy before the env var
 * is set; tighten by setting ADMIN_EMAILS in Vercel.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "c25royal@gmail.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * The current session IFF it belongs to an admin, else null. Use to gate
 * admin pages (redirect on null) and admin server actions (return on null —
 * actions are public POST endpoints, so the page guard alone is not enough).
 */
export async function getAdminSession() {
  const session = await getServerSession();
  if (!session) return null;
  return isAdminEmail(session.user.email) ? session : null;
}
