"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, Loader2, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { JobFilters } from "@/lib/jobs-search-params";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FREQUENCIES = [
  { value: "realtime", label: "Realtime", hint: "As soon as a role posts" },
  { value: "daily", label: "Daily", hint: "One digest each morning" },
  { value: "weekly", label: "Weekly", hint: "A weekly round-up" },
] as const;

const CHANNELS = [
  { value: "email", label: "Email", enabled: true },
  { value: "telegram", label: "Telegram", enabled: false },
  { value: "webhook", label: "Webhook", enabled: false },
] as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
      {children}
    </div>
  );
}

/**
 * Job-alert subscribe form (P9). Open to anyone — email + the filters
 * carried in from /jobs + frequency + channel. Subscribing triggers a
 * double opt-in email.
 */
export function AlertsForm({
  filters,
  chips,
  defaultEmail,
}: {
  filters: JobFilters;
  chips: string[];
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [frequency, setFrequency] = useState<string>("daily");
  const [channel, setChannel] = useState<string>("email");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          filters,
          frequency,
          channels: [channel],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not create the alert.");
        return;
      }
      setDone(true);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-subtle bg-surface p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-green/30 bg-accent-green/10">
          <MailCheck size={22} className="text-accent-green" />
        </span>
        <div className="text-[15px] font-semibold text-text-primary">
          Confirm your alert
        </div>
        <p className="max-w-[320px] text-[13px] leading-[1.55] text-text-secondary">
          We sent a confirmation link to{" "}
          <span className="text-text-bright">{email.trim()}</span>. Click it to
          start receiving matching roles.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-subtle bg-surface p-5 md:p-6"
    >
      {/* filter summary */}
      <div>
        <FieldLabel>This alert watches</FieldLabel>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-md border border-line bg-glass-hi px-2 py-0.5 text-[12px] text-text-bright"
              >
                {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-text-secondary">
            Every new role on the board.
          </p>
        )}
      </div>

      {/* email */}
      <div>
        <FieldLabel>Email</FieldLabel>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
      </div>

      {/* frequency */}
      <div>
        <FieldLabel>Frequency</FieldLabel>
        <div className="grid gap-2 sm:grid-cols-3">
          {FREQUENCIES.map((fr) => (
            <button
              key={fr.value}
              type="button"
              aria-pressed={frequency === fr.value}
              onClick={() => setFrequency(fr.value)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                frequency === fr.value
                  ? "border-accent-blue/50 bg-accent-blue/10"
                  : "border-line bg-glass hover:border-strong",
              )}
            >
              <div className="text-[13px] font-medium text-text-primary">
                {fr.label}
              </div>
              <div className="mt-0.5 text-[11px] text-text-tertiary">
                {fr.hint}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* channel */}
      <div>
        <FieldLabel>Channel</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((ch) => (
            <button
              key={ch.value}
              type="button"
              disabled={!ch.enabled}
              aria-pressed={channel === ch.value}
              onClick={() => ch.enabled && setChannel(ch.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                channel === ch.value
                  ? "border-accent-blue/50 bg-accent-blue/15 text-text-primary"
                  : "border-line bg-glass-hi text-text-secondary",
                ch.enabled
                  ? "hover:border-strong"
                  : "cursor-not-allowed opacity-50",
              )}
            >
              {ch.label}
              {!ch.enabled && (
                <span className="rounded bg-glass px-1 font-mono text-[8.5px] uppercase text-text-muted">
                  soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="cw-apply h-11 w-full text-[13.5px] disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Bell size={15} />
        )}
        Create job alert
      </button>
    </form>
  );
}
