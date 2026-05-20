import { Resend } from "resend";
import { APP_URL } from "@/lib/site";

/**
 * Transactional email. Magic-link sign-in (P8) + job-alert mail (P9).
 *
 * With no RESEND_API_KEY the message is logged to the server console —
 * a dev fallback so every flow stays testable before Resend and the
 * sending domain are wired up.
 */

const FROM = process.env.EMAIL_FROM ?? "Chainwork <onboarding@resend.dev>";
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,monospace";

/* ── shared markup ──────────────────────────────────────────── */

/** Dark card shell shared by every email. */
function emailShell(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#08080b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08080b;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#0c0c10;border:1px solid rgba(255,255,255,0.08);border-radius:16px;">
          <tr><td style="padding:30px 32px 0;">
            <div style="font-family:${SANS};font-size:18px;font-weight:700;color:#f5f5f7;letter-spacing:-0.02em;">chainwork</div>
          </td></tr>
          <tr><td style="padding:18px 32px 30px;">${bodyHtml}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function heading(text: string): string {
  return `<div style="font-family:${SANS};font-size:20px;font-weight:600;color:#f5f5f7;">${text}</div>`;
}

function paragraph(text: string): string {
  return `<div style="font-family:${SANS};font-size:14px;line-height:1.6;color:rgba(245,245,247,0.62);margin-top:8px;">${text}</div>`;
}

function ctaButton(label: string, url: string): string {
  return `<div style="margin-top:20px;"><a href="${url}" style="display:block;text-align:center;font-family:${SANS};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:10px;background:linear-gradient(135deg,#5b8def,#9d6bff);">${label}</a></div>`;
}

function fineprint(text: string): string {
  return `<div style="font-family:${SANS};font-size:12px;line-height:1.6;color:rgba(245,245,247,0.3);margin-top:18px;">${text}</div>`;
}

/* ── delivery ───────────────────────────────────────────────── */

async function deliver(opts: {
  to: string;
  subject: string;
  html: string;
  logLabel: string;
  logLine: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `\n── ${opts.logLabel} · no RESEND_API_KEY, dev fallback ──\n` +
        `  to:  ${opts.to}\n  ${opts.logLine}\n${"─".repeat(60)}\n`,
    );
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) {
    console.error("Resend send failed:", error);
    throw new Error("Could not send email.");
  }
}

/* ── magic-link sign-in (P8) ────────────────────────────────── */

export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  const html = emailShell(
    heading("Sign in to Chainwork") +
      paragraph(
        "Click the button below to finish signing in. This link expires in five minutes and can be used once.",
      ) +
      ctaButton("Sign in to Chainwork", url) +
      `<div style="font-family:${SANS};font-size:12px;line-height:1.6;color:rgba(245,245,247,0.42);margin-top:18px;">If the button does not work, paste this URL into your browser:</div>` +
      `<div style="font-family:${MONO};font-size:11px;color:rgba(245,245,247,0.42);word-break:break-all;margin-top:6px;">${url}</div>` +
      fineprint("If you did not request this, you can safely ignore this email."),
  );
  await deliver({
    to,
    subject: "Sign in to Chainwork",
    html,
    logLabel: "chainwork magic link",
    logLine: `url: ${url}`,
  });
}

/* ── job alerts (P9) ────────────────────────────────────────── */

/** Double opt-in — sent on subscribe; the link verifies the alert. */
export async function sendAlertConfirmEmail(
  to: string,
  confirmUrl: string,
): Promise<void> {
  const html = emailShell(
    heading("Confirm your job alert") +
      paragraph(
        "Confirm this address to start receiving new roles that match your filters. You can unsubscribe any time.",
      ) +
      ctaButton("Confirm job alert", confirmUrl) +
      fineprint("You received this because someone subscribed this address at chainwork. If that was not you, ignore this email."),
  );
  await deliver({
    to,
    subject: "Confirm your Chainwork job alert",
    html,
    logLabel: "chainwork alert confirm",
    logLine: `url: ${confirmUrl}`,
  });
}

type DigestJob = {
  slug: string;
  title: string;
  companyName: string;
  salaryMin: number;
  salaryMax: number;
};

function jobRowHtml(job: DigestJob): string {
  const k = (n: number) => Math.round(n / 1000);
  const salary = `$${k(job.salaryMin)}-${k(job.salaryMax)}k`;
  return `<a href="${APP_URL}/jobs/${job.slug}" style="display:block;text-decoration:none;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 14px;margin-top:8px;">
    <div style="font-family:${SANS};font-size:14px;font-weight:600;color:#f5f5f7;">${job.title}</div>
    <div style="font-family:${SANS};font-size:12px;color:rgba(245,245,247,0.62);margin-top:3px;">${job.companyName} · ${salary}</div>
  </a>`;
}

/** Digest (or single realtime) email of matching roles. */
export async function sendAlertDigestEmail(
  to: string,
  jobs: DigestJob[],
  unsubscribeToken: string,
  totalCount = jobs.length,
): Promise<void> {
  const unsubUrl = `${APP_URL}/alerts/confirm/${unsubscribeToken}?unsubscribe=1`;
  const noun = totalCount === 1 ? "role" : "roles";
  const html = emailShell(
    heading(`${totalCount} new ${noun} matching your alert`) +
      paragraph("Fresh roles from the chainwork board:") +
      jobs.map(jobRowHtml).join("") +
      ctaButton("Browse all roles", `${APP_URL}/jobs`) +
      fineprint(
        `You are receiving job alerts from chainwork. <a href="${unsubUrl}" style="color:rgba(245,245,247,0.5);">Unsubscribe</a>.`,
      ),
  );
  await deliver({
    to,
    subject: `${totalCount} new ${noun} on Chainwork`,
    html,
    logLabel: "chainwork alert digest",
    logLine: `${totalCount} ${noun}, unsubscribe: ${unsubUrl}`,
  });
}
