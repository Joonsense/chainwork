"use client";

import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Check } from "lucide-react";
import type { Company } from "@/db/schema";
import { ECOSYSTEMS } from "@/lib/ecosystems";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { STAGES, ECOSYSTEM_OPTIONS, type PostForm } from "@/lib/post-schema";
import {
  TextField,
  SelectField,
  ChipGroup,
  FieldShell,
} from "./wizard-fields";

const ECO_OPTIONS = ECOSYSTEM_OPTIONS.map((k) => ({
  value: k,
  label: ECOSYSTEMS[k]?.label ?? k.toUpperCase(),
}));
const STAGE_OPTIONS = STAGES.map((s) => ({ value: s, label: s }));

/** "Helix Labs" → "HL", "Forge" → "FO". */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function StepCompany({ companies }: { companies: Company[] }) {
  const {
    watch,
    setValue,
    clearErrors,
    register,
    formState: { errors },
  } = useFormContext<PostForm>();

  const mode = watch("companyMode");
  const name = watch("name");
  const logoText = watch("logoText");
  const logoBg = watch("logoBg");
  const logoFg = watch("logoFg");
  const companyId = watch("companyId");

  // Auto-fill slug + monogram from the name until the user edits them.
  const slugEdited = useRef(false);
  const logoEdited = useRef(false);
  useEffect(() => {
    if (mode !== "new") return;
    // Auto-filled fields also clear any stale error from an earlier
    // "Next" press on the empty form.
    if (!slugEdited.current) {
      setValue("slug", slugify(name));
      clearErrors("slug");
    }
    if (!logoEdited.current) {
      setValue("logoText", initials(name));
      clearErrors("logoText");
    }
  }, [name, mode, setValue, clearErrors]);

  const picked = companies.find((c) => c.id === companyId);

  return (
    <div className="space-y-5">
      {/* mode toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["existing", "new"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() =>
              setValue("companyMode", m, { shouldValidate: true })
            }
            className={cn(
              "rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors",
              mode === m
                ? "border-accent-blue/50 bg-accent-blue/10 text-text-primary"
                : "border-line bg-glass text-text-secondary hover:border-strong",
            )}
          >
            {m === "existing" ? "Existing company" : "New company"}
          </button>
        ))}
      </div>

      {mode === "existing" ? (
        <>
          <SelectField
            name="companyId"
            label="Company"
            required
            placeholder="Select a company…"
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
          />
          {picked && (
            <div className="flex items-center gap-3 rounded-xl border border-subtle bg-surface p-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line text-[14px] font-semibold"
                style={{ background: picked.logoBg, color: picked.logoFg }}
              >
                {picked.logoText}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-text-bright">
                  <span className="truncate">{picked.name}</span>
                  {picked.verified && (
                    <Check
                      size={12}
                      strokeWidth={2.6}
                      className="shrink-0 text-accent-green"
                    />
                  )}
                </div>
                <div className="text-[12px] text-text-tertiary">
                  {[picked.stage, picked.size, picked.hq]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="name"
              label="Company name"
              placeholder="Helix Labs"
              required
            />
            <TextField
              name="slug"
              label="URL slug"
              placeholder="helix-labs"
              required
              hint="Lowercase, hyphenated. Auto-filled from the name."
              onValueChange={() => {
                slugEdited.current = true;
              }}
            />
          </div>

          {/* logo monogram */}
          <FieldShell
            label="Logo monogram"
            required
            error={errors.logoText?.message}
            hint="1–3 letters on a colored square — shown on every card."
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line text-[15px] font-semibold"
                style={{ background: logoBg, color: logoFg }}
              >
                {logoText || "—"}
              </span>
              <input
                {...register("logoText")}
                maxLength={3}
                placeholder="HL"
                aria-label="Monogram letters"
                onInput={() => {
                  logoEdited.current = true;
                }}
                className="h-12 w-20 rounded-lg border border-input bg-transparent text-center text-[15px] font-semibold uppercase text-text-primary outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
              {(["logoBg", "logoFg"] as const).map((field) => (
                <label
                  key={field}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="font-mono text-[9px] uppercase text-text-muted">
                    {field === "logoBg" ? "Background" : "Text"}
                  </span>
                  <input
                    type="color"
                    {...register(field)}
                    aria-label={
                      field === "logoBg"
                        ? "Background color"
                        : "Text color"
                    }
                    className="h-9 w-12 cursor-pointer rounded-lg border border-line bg-transparent"
                  />
                </label>
              ))}
            </div>
          </FieldShell>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="size"
              label="Team size"
              placeholder="20–35"
              required
            />
            <SelectField
              name="stage"
              label="Funding stage"
              required
              placeholder="Select stage…"
              options={STAGE_OPTIONS}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="hq"
              label="Headquarters"
              placeholder="Remote-first"
            />
            <TextField
              name="website"
              label="Website"
              placeholder="https://helix-labs.xyz"
            />
          </div>

          <TextField
            name="oneLiner"
            label="One-liner"
            placeholder="What the company builds, in one line."
            hint="Shown as the company's focus."
          />

          <ChipGroup
            name="companyEcosystems"
            label="Ecosystems"
            required
            options={ECO_OPTIONS}
          />
        </>
      )}
    </div>
  );
}
