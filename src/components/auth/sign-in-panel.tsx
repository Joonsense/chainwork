"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** GitHub mark — lucide dropped brand icons, so it is inlined. */
function GithubMark({ size = 17 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/**
 * Shared sign-in UI — GitHub OAuth (primary) + email magic link.
 * Used inside the nav dialog and on the standalone /sign-in page.
 * `callbackURL` is where Better-Auth lands the user once authenticated.
 */
export function SignInPanel({ callbackURL }: { callbackURL: string }) {
  const [email, setEmail] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function signInGithub() {
    setGithubLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL,
    });
    // On success the browser is redirected to GitHub; only errors return here.
    if (error) {
      toast.error(error.message ?? "GitHub sign-in is unavailable.");
      setGithubLoading(false);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Enter a valid email address.");
      return;
    }
    setEmailLoading(true);
    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL,
    });
    setEmailLoading(false);
    if (error) {
      toast.error(error.message ?? "Could not send the sign-in link.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-green/30 bg-accent-green/10">
          <MailCheck size={22} className="text-accent-green" />
        </span>
        <div className="text-[15px] font-semibold text-text-primary">
          Check your inbox
        </div>
        <p className="max-w-[300px] text-[13px] leading-[1.55] text-text-secondary">
          We sent a sign-in link to{" "}
          <span className="text-text-bright">{email.trim()}</span>. It expires
          in five minutes.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-1 text-[12px] text-accent-blue hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-[1.55] text-text-secondary">
        Sign in to save roles, get matched, and post jobs.
      </p>

      {/* option 1 — GitHub */}
      <button
        type="button"
        onClick={signInGithub}
        disabled={githubLoading}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-[#f5f5f7] text-[14px] font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {githubLoading ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <GithubMark />
        )}
        Continue with GitHub
      </button>

      {/* divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">
          or
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* option 2 — email magic link */}
      <form onSubmit={sendMagicLink} className="space-y-2">
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
        <button
          type="submit"
          disabled={emailLoading}
          className="cw-apply h-11 w-full text-[13.5px] disabled:opacity-60"
        >
          {emailLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Mail size={15} />
          )}
          Email me a sign-in link
        </button>
      </form>
    </div>
  );
}
