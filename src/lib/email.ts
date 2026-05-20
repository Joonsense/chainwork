import { Resend } from "resend";

/**
 * Transactional email (P8). Currently just the magic-link sign-in mail.
 *
 * With no RESEND_API_KEY the link is logged to the server console — a
 * dev fallback so the sign-in flow is fully testable before Resend and
 * the sending domain are wired up.
 */

const FROM = process.env.EMAIL_FROM ?? "Chainwork <onboarding@resend.dev>";

/** Dark-themed magic-link email — brand-gradient CTA, raw-URL fallback. */
function magicLinkEmailHtml(url: string): string {
  const sans =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#08080b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08080b;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#0c0c10;border:1px solid rgba(255,255,255,0.08);border-radius:16px;">
          <tr><td style="padding:32px 32px 0;">
            <div style="font-family:${sans};font-size:18px;font-weight:700;color:#f5f5f7;letter-spacing:-0.02em;">chainwork</div>
          </td></tr>
          <tr><td style="padding:20px 32px 0;">
            <div style="font-family:${sans};font-size:20px;font-weight:600;color:#f5f5f7;">Sign in to Chainwork</div>
            <div style="font-family:${sans};font-size:14px;line-height:1.6;color:rgba(245,245,247,0.62);margin-top:8px;">Click the button below to finish signing in. This link expires in five minutes and can be used once.</div>
          </td></tr>
          <tr><td style="padding:24px 32px;">
            <a href="${url}" style="display:block;text-align:center;font-family:${sans};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:10px;background:linear-gradient(135deg,#5b8def,#9d6bff);">Sign in to Chainwork</a>
          </td></tr>
          <tr><td style="padding:0 32px 28px;">
            <div style="font-family:${sans};font-size:12px;line-height:1.6;color:rgba(245,245,247,0.42);">If the button does not work, paste this URL into your browser:</div>
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:rgba(245,245,247,0.42);word-break:break-all;margin-top:6px;">${url}</div>
            <div style="font-family:${sans};font-size:12px;line-height:1.6;color:rgba(245,245,247,0.26);margin-top:18px;">If you did not request this, you can safely ignore this email.</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Sends the magic-link sign-in email (or logs it when Resend is unset). */
export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `\n── chainwork magic link · no RESEND_API_KEY, dev fallback ──\n` +
        `  to:  ${to}\n  url: ${url}\n` +
        `────────────────────────────────────────────────────────────\n`,
    );
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Sign in to Chainwork",
    html: magicLinkEmailHtml(url),
  });
  if (error) {
    console.error("Resend send failed:", error);
    throw new Error("Could not send the sign-in email.");
  }
}
