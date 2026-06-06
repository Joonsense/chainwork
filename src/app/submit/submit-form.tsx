"use client";

import { useRef, useState } from "react";
import { useForm, Controller, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Loader2, Send, Sparkles, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  submissionSchema,
  type SubmissionForm,
  SUBMISSION_MIN_DESCRIPTION,
} from "@/lib/submission-schema";
import {
  ROLE_OPTIONS,
  LOCATION_OPTIONS,
  ECOSYSTEM_OPTIONS,
} from "@/lib/jobs-search-params";
import {
  SENIORITIES,
  EMPLOYMENT_TYPES,
  CURRENCIES,
  POST_WEEK_OPTIONS,
  POST_WEEKLY_USD,
} from "@/lib/post-schema";
import { ECOSYSTEMS } from "@/lib/ecosystems";
import { createSubmission, createPaidPost, importFromUrl } from "./actions";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
      {children}
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[12px] text-accent-red">{msg}</p>;
}

const selectCls =
  "h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-[14px] text-text-primary outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/** Salary fields store raw digits (schema wants `\d+`) but display with commas. */
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const withCommas = (s: string) => {
  const d = onlyDigits(s);
  return d ? Number(d).toLocaleString("en-US") : "";
};

export function SubmitForm({ tier = "free" }: { tier?: "free" | "paid" }) {
  const paid = tier === "paid";
  const [done, setDone] = useState(false);
  const [weeks, setWeeks] = useState(1);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  // A blank tab we pop open synchronously on the pay click (so the browser
  // treats it as user-initiated and doesn't block it), then point at the
  // hosted checkout once the invoice is created. Keeps the filled form in
  // this tab so nothing is lost if the buyer comes back.
  const checkoutWinRef = useRef<Window | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionForm>({
    // Cast bridges a types-only drift between the installed zod (4.4) and
    // the zod-core version @hookform/resolvers vendors — runtime is fine.
    resolver: (zodResolver as (s: unknown) => Resolver<SubmissionForm>)(
      submissionSchema,
    ),
    defaultValues: {
      submitterEmail: "",
      companyName: "",
      companyWebsite: "",
      title: "",
      roleCategory: "",
      seniority: "Senior",
      employmentType: "Full-time",
      ecosystems: [],
      location: "remote_worldwide",
      salaryMin: "",
      salaryMax: "",
      salaryCurrency: "USD",
      hasTokenEquity: false,
      descriptionMd: "",
      applyUrl: "",
      applyEmail: "",
      note: "",
    },
  });

  // Close the tab we popped open on click — for any path that won't hand off
  // to a hosted checkout (validation failed, create failed, or dev fallback).
  function closeCheckoutWindow() {
    checkoutWinRef.current?.close();
    checkoutWinRef.current = null;
  }

  async function onSubmit(values: SubmissionForm) {
    if (paid) {
      const res = await createPaidPost({ data: values, weeks });
      if (!res.ok) {
        closeCheckoutWindow();
        toast.error(res.error);
        return;
      }
      // Hand off to hosted checkout in the tab we pre-opened, so the filled
      // form stays put in this tab. Dev fallback (no rail) returns no URL.
      if (res.checkoutUrl) {
        const win = checkoutWinRef.current;
        if (win && !win.closed) win.location.href = res.checkoutUrl;
        else window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
        checkoutWinRef.current = null;
        toast.success("Secure checkout opened in a new tab.");
        return;
      }
      closeCheckoutWindow();
      setDone(true);
      return;
    }
    const res = await createSubmission({ data: values });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDone(true);
  }

  // On a failed submit, bring the first invalid field into view and focus it —
  // on a long form the error can otherwise be off-screen (esp. on mobile).
  function onInvalid(errs: FieldErrors<SubmissionForm>) {
    closeCheckoutWindow();
    const names = Object.keys(errs);
    const form = document.getElementById("submit-form");
    const fields = Array.from(
      form?.querySelectorAll<HTMLElement>("[name]") ?? [],
    );
    const target = fields.find((el) =>
      names.includes(el.getAttribute("name") ?? ""),
    );
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
    }
  }

  async function handleImport() {
    const url = importUrl.trim();
    if (!url) {
      toast.error("Paste a job link first.");
      return;
    }
    setImporting(true);
    const res = await importFromUrl(url);
    setImporting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    // Merge imported fields over whatever the poster has already typed.
    reset({ ...getValues(), ...res.fields });
    toast.success(`Imported from ${res.source}. Review the fields, then submit.`);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-subtle bg-surface p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-green/30 bg-accent-green/10">
          <Check size={22} className="text-accent-green" />
        </span>
        <div className="text-[16px] font-semibold text-text-primary">
          {paid ? "Payment received" : "Submitted for review"}
        </div>
        <p className="max-w-[360px] text-[13px] leading-[1.55] text-text-secondary">
          Thanks, your role is in the queue. We review submissions for spam
          and accuracy, then publish. It usually goes live within a day, and
          we&apos;ll email you when it does.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── paste-to-autofill ── */}
      <div className="mb-4 rounded-2xl border border-accent-blue/25 bg-accent-blue/[0.06] p-4 md:p-5">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent-blue" />
          <span className="text-[13.5px] font-semibold text-text-primary">
            Already on Greenhouse, Lever, or Ashby?
          </span>
        </div>
        <p className="mt-1 text-[12.5px] leading-[1.55] text-text-secondary">
          Paste the job link and we&apos;ll fill the form from the public ATS
          feed, no scraping, no retyping. Review and submit.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            inputMode="url"
            placeholder="https://boards.greenhouse.io/acme/jobs/123456"
            className="h-11 flex-1"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleImport();
              }
            }}
            disabled={importing}
          />
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-accent-blue/40 bg-accent-blue/15 px-4 text-[13.5px] font-medium text-text-primary transition-colors hover:bg-accent-blue/25 disabled:opacity-60"
          >
            {importing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Wand2 size={15} />
            )}
            Autofill
          </button>
        </div>
      </div>

      <form
        id="submit-form"
        onSubmit={(e) => void handleSubmit(onSubmit, onInvalid)(e)}
        className="space-y-6 rounded-2xl border border-subtle bg-surface p-5 md:p-7"
      >
        {/* ── you ── */}
      <div>
        <FieldLabel>Your email</FieldLabel>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="h-11"
          {...register("submitterEmail")}
        />
        <Err msg={errors.submitterEmail?.message} />
        <p className="mt-1 text-[12px] text-text-tertiary">
          We email you when the role goes live. Never shown publicly.
        </p>
      </div>

      {/* ── company ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Company name</FieldLabel>
          <Input
            placeholder="Acme Protocol"
            className="h-11"
            {...register("companyName")}
          />
          <Err msg={errors.companyName?.message} />
        </div>
        <div>
          <FieldLabel>Company website</FieldLabel>
          <Input
            placeholder="acme.xyz"
            className="h-11"
            {...register("companyWebsite")}
          />
          <Err msg={errors.companyWebsite?.message} />
        </div>
      </div>

      {/* ── role ── */}
      <div>
        <FieldLabel>Job title</FieldLabel>
        <Input
          placeholder="Senior Smart Contract Engineer"
          className="h-11"
          {...register("title")}
        />
        <Err msg={errors.title?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel>Discipline</FieldLabel>
          <select className={selectCls} {...register("roleCategory")}>
            <option value="">Select…</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.category}>
                {r.label}
              </option>
            ))}
          </select>
          <Err msg={errors.roleCategory?.message} />
        </div>
        <div>
          <FieldLabel>Seniority</FieldLabel>
          <select className={selectCls} {...register("seniority")}>
            {SENIORITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Type</FieldLabel>
          <select className={selectCls} {...register("employmentType")}>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── ecosystems ── */}
      <div>
        <FieldLabel>Ecosystems</FieldLabel>
        <Controller
          control={control}
          name="ecosystems"
          render={({ field }) => (
            <div className="flex flex-wrap gap-1.5">
              {ECOSYSTEM_OPTIONS.map((key) => {
                const on = field.value.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      field.onChange(
                        on
                          ? field.value.filter((v) => v !== key)
                          : [...field.value, key],
                      )
                    }
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                      on
                        ? "border-accent-blue/50 bg-accent-blue/15 text-text-primary"
                        : "border-line bg-glass-hi text-text-secondary hover:border-strong",
                    )}
                  >
                    {ECOSYSTEMS[key]?.label ?? key.toUpperCase()}
                  </button>
                );
              })}
            </div>
          )}
        />
        <Err msg={errors.ecosystems?.message} />
      </div>

      {/* ── location ── */}
      <div>
        <FieldLabel>Location</FieldLabel>
        <select className={selectCls} {...register("location")}>
          {LOCATION_OPTIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <Err msg={errors.location?.message} />
      </div>

      {/* ── compensation ── */}
      <div>
        <FieldLabel>Compensation (optional, full annual amount)</FieldLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Controller
            control={control}
            name="salaryMin"
            render={({ field }) => (
              <Input
                inputMode="numeric"
                placeholder="Min, e.g. 140,000"
                className="h-11"
                value={withCommas(field.value)}
                onChange={(e) => field.onChange(onlyDigits(e.target.value))}
              />
            )}
          />
          <Controller
            control={control}
            name="salaryMax"
            render={({ field }) => (
              <Input
                inputMode="numeric"
                placeholder="Max, e.g. 200,000"
                className="h-11"
                value={withCommas(field.value)}
                onChange={(e) => field.onChange(onlyDigits(e.target.value))}
              />
            )}
          />
          <select className={cn(selectCls, "sm:w-24")} {...register("salaryCurrency")}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Err msg={errors.salaryMin?.message ?? errors.salaryMax?.message} />
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[13px] text-text-secondary">
          <input type="checkbox" className="accent-accent-blue" {...register("hasTokenEquity")} />
          Includes token / equity
        </label>
      </div>

      {/* ── description ── */}
      <div>
        <FieldLabel>Role description</FieldLabel>
        <Textarea
          rows={8}
          placeholder={`What the role does, the team, the stack… (min ${SUBMISSION_MIN_DESCRIPTION} characters). Markdown supported.`}
          {...register("descriptionMd")}
        />
        <Err msg={errors.descriptionMd?.message} />
      </div>

      {/* ── apply ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Apply URL</FieldLabel>
          <Input
            placeholder="acme.xyz/careers/…"
            className="h-11"
            {...register("applyUrl")}
          />
          <Err msg={errors.applyUrl?.message} />
        </div>
        <div>
          <FieldLabel>…or apply email</FieldLabel>
          <Input
            placeholder="jobs@acme.xyz"
            className="h-11"
            {...register("applyEmail")}
          />
          <Err msg={errors.applyEmail?.message} />
        </div>
      </div>

      {paid && (
        <div>
          <FieldLabel>Featured duration</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {POST_WEEK_OPTIONS.map((w) => {
              const on = weeks === w;
              return (
                <button
                  key={w}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setWeeks(w)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                    on
                      ? "border-accent-blue/50 bg-accent-blue/15 text-text-primary"
                      : "border-line bg-glass-hi text-text-secondary hover:border-strong",
                  )}
                >
                  {w} week{w > 1 ? "s" : ""} · ${POST_WEEKLY_USD * w}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky action bar — the pay CTA stays in view at any scroll depth. */}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-2 rounded-b-2xl border-t border-subtle bg-surface/85 px-5 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-surface/70 md:-mx-7 md:-mb-7 md:px-7">
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={() => {
            // Pop the tab now, inside the click, so it isn't blocked; we point
            // it at the checkout once the invoice comes back (no noopener here —
            // that would null the handle we need to navigate).
            if (!paid) return;
            const win = window.open("", "_blank");
            if (win) {
              win.document.write(
                '<!doctype html><meta charset="utf-8"><title>Secure checkout</title><body style="margin:0;display:grid;place-items:center;height:100vh;font:15px/1.5 system-ui,sans-serif;background:#0b0b0f;color:#e9e9ec">Preparing secure crypto checkout…</body>',
              );
            }
            checkoutWinRef.current = win;
          }}
          className="cw-apply h-12 w-full text-[14px] disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          {paid
            ? `Continue to payment · $${POST_WEEKLY_USD * weeks} (${weeks} week${weeks > 1 ? "s" : ""})`
            : "Submit role for review"}
        </button>
        <p className="mt-2 text-center text-[12px] text-text-tertiary">
          {paid
            ? "Secure crypto checkout (BTC, ETH, USDC, 200+ tokens), opens in a new tab. Featured to the top of the board for the chosen window. Reviewed before going live."
            : "Free. Reviewed for spam & accuracy before going live."}
        </p>
      </div>
      </form>
    </>
  );
}
