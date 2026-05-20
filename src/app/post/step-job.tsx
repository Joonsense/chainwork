"use client";

import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { JobMarkdown } from "@/components/jobs/job-markdown";
import { ECOSYSTEMS } from "@/lib/ecosystems";
import {
  ROLE_CATEGORIES,
  SENIORITIES,
  EMPLOYMENT_TYPES,
  CURRENCIES,
  ECOSYSTEM_OPTIONS,
  LOCATION_OPTIONS,
  MIN_DESCRIPTION,
  type PostForm,
} from "@/lib/post-schema";
import {
  TextField,
  SelectField,
  DynamicList,
  ChipGroup,
  ToggleField,
  FieldShell,
} from "./wizard-fields";

const opts = (values: readonly string[]) =>
  values.map((v) => ({ value: v, label: v }));
const ECO_OPTIONS = ECOSYSTEM_OPTIONS.map((k) => ({
  value: k,
  label: ECOSYSTEMS[k]?.label ?? k.toUpperCase(),
}));
const LOCATION_SELECT = LOCATION_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function StepJob() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<PostForm>();

  const description = watch("descriptionMd") ?? "";
  const descLen = description.trim().length;

  return (
    <div className="space-y-5">
      <TextField
        name="title"
        label="Job title"
        placeholder="Senior Protocol Engineer"
        required
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          name="roleCategory"
          label="Role category"
          required
          placeholder="Select…"
          options={ROLE_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <SelectField
          name="seniority"
          label="Seniority"
          required
          options={opts(SENIORITIES)}
        />
        <SelectField
          name="employmentType"
          label="Employment type"
          required
          options={opts(EMPLOYMENT_TYPES)}
        />
      </div>

      {/* description + live markdown preview */}
      <FieldShell
        label="Description"
        required
        error={errors.descriptionMd?.message}
        hint={`Markdown supported. ${descLen}/${MIN_DESCRIPTION} characters minimum.`}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Textarea
            rows={12}
            placeholder="Describe the role, the team, and why it matters…"
            aria-invalid={Boolean(errors.descriptionMd)}
            className="min-h-[260px] font-mono text-[13px]"
            {...register("descriptionMd")}
          />
          <div className="max-h-[320px] min-h-[260px] overflow-auto rounded-lg border border-line bg-surface p-3.5">
            {description.trim() ? (
              <JobMarkdown>{description}</JobMarkdown>
            ) : (
              <p className="text-[13px] text-text-muted">
                Markdown preview appears here as you type.
              </p>
            )}
          </div>
        </div>
      </FieldShell>

      <DynamicList
        name="responsibilities"
        label="What you'll do"
        placeholder="Ship consensus-layer changes in Rust"
        addLabel="Add responsibility"
        required
      />
      <DynamicList
        name="requirements"
        label="Requirements"
        placeholder="5+ years building distributed systems"
        addLabel="Add requirement"
        required
      />
      <DynamicList
        name="niceToHave"
        label="Nice to have"
        placeholder="Open-source contributions in crypto or AI"
        addLabel="Add nice-to-have"
        hint="Optional."
      />
      <DynamicList
        name="skills"
        label="Skills"
        placeholder="Rust"
        addLabel="Add skill"
        hint="Shown as tags on the job card."
      />

      {/* compensation */}
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="salaryMin"
          label="Salary min (annual)"
          placeholder="150000"
          required
        />
        <TextField
          name="salaryMax"
          label="Salary max (annual)"
          placeholder="220000"
          required
        />
        <SelectField
          name="salaryCurrency"
          label="Currency"
          required
          options={opts(CURRENCIES)}
        />
      </div>

      <ToggleField
        name="hasTokenEquity"
        label="Includes token or equity"
        description="Compensation comes with token or equity upside."
      />

      {/* location + ecosystems */}
      <SelectField
        name="location"
        label="Location"
        required
        placeholder="Select a remote scope…"
        options={LOCATION_SELECT}
      />
      <ChipGroup
        name="jobEcosystems"
        label="Ecosystems"
        required
        options={ECO_OPTIONS}
      />

      {/* apply */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="applyUrl"
          label="Apply URL"
          placeholder="https://company.xyz/careers/role"
          hint="Provide an apply URL or an email below."
        />
        <TextField
          name="applyEmail"
          label="Apply email"
          placeholder="careers@company.xyz"
        />
      </div>
    </div>
  );
}
