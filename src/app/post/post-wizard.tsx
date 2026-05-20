"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import type { Company } from "@/db/schema";
import { postFormSchema, type PostForm } from "@/lib/post-schema";
import { cn } from "@/lib/utils";
import { submitJob } from "./actions";
import { StepCompany } from "./step-company";
import { StepJob } from "./step-job";
import { StepReview } from "./step-review";

const STEPS = ["Company", "Role", "Review"] as const;

/* Fields validated when advancing past each step. */
const STEP_FIELDS: Record<number, (keyof PostForm)[]> = {
  0: [
    "companyMode",
    "companyId",
    "name",
    "slug",
    "logoText",
    "logoBg",
    "logoFg",
    "size",
    "stage",
    "hq",
    "website",
    "oneLiner",
    "companyEcosystems",
  ],
  1: [
    "title",
    "roleCategory",
    "seniority",
    "employmentType",
    "descriptionMd",
    "responsibilities",
    "requirements",
    "niceToHave",
    "skills",
    "salaryMin",
    "salaryMax",
    "salaryCurrency",
    "hasTokenEquity",
    "location",
    "jobEcosystems",
    "applyUrl",
    "applyEmail",
  ],
};

const DEFAULT_VALUES: PostForm = {
  companyMode: "new",
  companyId: "",
  name: "",
  slug: "",
  logoText: "",
  logoBg: "#6f41d8",
  logoFg: "#fafaf7",
  size: "",
  stage: "",
  hq: "",
  website: "",
  oneLiner: "",
  companyEcosystems: [],
  title: "",
  roleCategory: "",
  seniority: "Mid",
  employmentType: "Full-time",
  descriptionMd: "",
  responsibilities: [{ value: "" }],
  requirements: [{ value: "" }],
  niceToHave: [],
  skills: [{ value: "" }],
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "USD",
  hasTokenEquity: false,
  location: "",
  jobEcosystems: [],
  applyUrl: "",
  applyEmail: "",
  isFeatured: false,
};

function ProgressIndicator({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "todo";
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]",
                state === "done" &&
                  "border-accent-green/40 bg-accent-green/15 text-accent-green",
                state === "current" &&
                  "border-accent-blue/50 bg-accent-blue/15 text-text-primary",
                state === "todo" && "border-line text-text-muted",
              )}
            >
              {state === "done" ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-[12.5px] font-medium",
                state === "todo" ? "text-text-muted" : "text-text-secondary",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1",
                  i < step ? "bg-accent-green/40" : "bg-line",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function PostWizard({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<PostForm>({
    // Cast bridges a types-only drift between the installed zod (4.4) and
    // the zod-core version @hookform/resolvers vendors — runtime is fine.
    resolver: (zodResolver as (s: unknown) => Resolver<PostForm>)(
      postFormSchema,
    ),
    mode: "onTouched",
    shouldUnregister: false,
    defaultValues: DEFAULT_VALUES,
  });

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  async function goNext() {
    const ok = await methods.trigger(STEP_FIELDS[step]);
    if (ok) {
      setStep((s) => Math.min(s + 1, 2));
      toTop();
    }
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    toTop();
  }

  // Submit is driven programmatically — there is deliberately no native
  // form submission, so step navigation can never trip it.
  const runSubmit = methods.handleSubmit(
    async (data) => {
      if (step !== 2) return;
      setSubmitting(true);
      setServerError(null);
      const res = await submitJob({ data });
      if (res.ok) {
        router.push(`/post/success?slug=${encodeURIComponent(res.slug)}`);
      } else {
        setServerError(res.error);
        setSubmitting(false);
      }
    },
    (errors) => {
      // Validation failed — jump to the earliest step that has an error.
      if (STEP_FIELDS[0].some((f) => f in errors)) setStep(0);
      else if (STEP_FIELDS[1].some((f) => f in errors)) setStep(1);
      toTop();
    },
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ProgressIndicator step={step} />

        <div className="mt-6 rounded-2xl border border-subtle bg-surface p-5 md:p-6">
          {step === 0 && <StepCompany companies={companies} />}
          {step === 1 && <StepJob />}
          {step === 2 && <StepReview companies={companies} />}
        </div>

        {serverError && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
            {serverError}
          </p>
        )}

        <nav className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || submitting}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line px-4 text-[13px] text-text-secondary transition-colors hover:border-strong hover:text-text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span className="font-mono text-[11px] text-text-tertiary">
            Step {step + 1} / 3
          </span>
          {step < 2 ? (
            <button
              key="next"
              type="button"
              onClick={goNext}
              className="cw-apply h-10 px-5 text-[13px]"
            >
              Next <ArrowRight size={14} strokeWidth={2.4} />
            </button>
          ) : (
            <button
              key="publish"
              type="button"
              onClick={() => runSubmit()}
              disabled={submitting}
              className="cw-apply h-10 px-5 text-[13px] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Publishing…
                </>
              ) : (
                <>
                  Publish role <Check size={14} strokeWidth={2.6} />
                </>
              )}
            </button>
          )}
        </nav>
      </form>
    </FormProvider>
  );
}
