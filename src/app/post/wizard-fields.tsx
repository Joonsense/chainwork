"use client";

import { useId } from "react";
import {
  useFormContext,
  useFieldArray,
  type Path,
} from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PostForm } from "@/lib/post-schema";

/* Shared field primitives for the /post wizard. Each reads the form via
   `useFormContext`, so steps just drop them in — no prop drilling. */

/** Reads the (possibly array-level) error message for a top-level field. */
function useFieldError(name: keyof PostForm): string | undefined {
  const {
    formState: { errors },
  } = useFormContext<PostForm>();
  const node = errors[name] as
    | { message?: string; root?: { message?: string } }
    | undefined;
  return node?.message ?? node?.root?.message;
}

/* ── label + error wrapper ──────────────────────────────────── */
export function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary"
      >
        {label}
        {required && <span className="text-accent-blue"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11.5px] leading-snug text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] leading-snug text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── single-line text input ─────────────────────────────────── */
export function TextField({
  name,
  label,
  placeholder,
  type = "text",
  required,
  hint,
  onValueChange,
}: {
  name: keyof PostForm;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  onValueChange?: (value: string) => void;
}) {
  const id = useId();
  const { register } = useFormContext<PostForm>();
  const error = useFieldError(name);
  const reg = register(name);
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      required={required}
    >
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        {...reg}
        onChange={(e) => {
          reg.onChange(e);
          onValueChange?.(e.target.value);
        }}
      />
    </FieldShell>
  );
}

/* ── native select, styled to match Input ───────────────────── */
const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-text-primary transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30";

export function SelectField({
  name,
  label,
  options,
  placeholder,
  required,
  hint,
}: {
  name: keyof PostForm;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  const { register } = useFormContext<PostForm>();
  const error = useFieldError(name);
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      required={required}
    >
      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={SELECT_CLASS}
        {...register(name)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/* ── repeatable "+ add" list ─────────────────────────────────── */
type ListName = "responsibilities" | "requirements" | "niceToHave" | "skills";

export function DynamicList({
  name,
  label,
  placeholder,
  addLabel,
  required,
  hint,
}: {
  name: ListName;
  label: string;
  placeholder: string;
  addLabel: string;
  required?: boolean;
  hint?: string;
}) {
  const { control, register } = useFormContext<PostForm>();
  const { fields, append, remove } = useFieldArray({ control, name });
  const error = useFieldError(name);

  return (
    <FieldShell label={label} error={error} hint={hint} required={required}>
      <div className="space-y-2">
        {fields.map((field, i) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              placeholder={placeholder}
              {...register(`${name}.${i}.value` as Path<PostForm>)}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove item"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-text-tertiary transition-colors hover:border-strong hover:text-text-primary"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ value: "" })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-2.5 py-1.5 text-[12px] text-text-secondary transition-colors hover:border-strong hover:text-text-primary"
        >
          <Plus size={13} />
          {addLabel}
        </button>
      </div>
    </FieldShell>
  );
}

/* ── multi-select chip group ────────────────────────────────── */
type ChipName = "companyEcosystems" | "jobEcosystems";

export function ChipGroup({
  name,
  label,
  options,
  required,
  hint,
}: {
  name: ChipName;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
}) {
  const { watch, setValue } = useFormContext<PostForm>();
  const error = useFieldError(name);
  const selected = watch(name) ?? [];

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    setValue(name, next, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <FieldShell label={label} error={error} hint={hint} required={required}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.value)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors",
                on
                  ? "border-accent-blue/50 bg-accent-blue/15 text-text-primary"
                  : "border-line bg-glass-hi text-text-secondary hover:border-strong hover:text-text-primary",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

/* ── checkbox toggle row ────────────────────────────────────── */
export function ToggleField({
  name,
  label,
  description,
}: {
  name: "hasTokenEquity" | "isFeatured";
  label: string;
  description?: string;
}) {
  const id = useId();
  const { register } = useFormContext<PostForm>();
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-glass p-3.5 transition-colors hover:border-strong"
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-accent-blue"
        {...register(name)}
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-text-primary">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[12px] leading-[1.5] text-text-tertiary">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
