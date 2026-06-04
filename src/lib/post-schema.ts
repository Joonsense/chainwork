import { z } from "zod";
import {
  ROLE_OPTIONS,
  LOCATION_OPTIONS,
  ECOSYSTEM_OPTIONS,
} from "@/lib/jobs-search-params";

/**
 * Validation for the /post job form (P7). Shared by the client wizard
 * (via zodResolver) and the server action (re-validated, never trusted).
 */

export { LOCATION_OPTIONS, ECOSYSTEM_OPTIONS };

/** The 9 role categories, taken from the /jobs filter taxonomy. */
export const ROLE_CATEGORIES = ROLE_OPTIONS.map((o) => o.category);

export const STAGES = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Bootstrapped",
  "Public",
] as const;
export const SENIORITIES = [
  "Junior",
  "Mid",
  "Senior",
  "Staff",
  "Principal",
] as const;
export const EMPLOYMENT_TYPES = ["Full-time", "Contract"] as const;
export const CURRENCIES = ["USD", "USDC", "USDT", "EUR", "GBP"] as const;

export const MIN_DESCRIPTION = 200;

const INT_RE = /^\d+$/;
const SLUG_RE = /^[a-z0-9-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isUrl = (v: string): boolean => {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
};

/** One row of a dynamic list (responsibilities, requirements, …). */
const listRow = z.object({ value: z.string() });
const hasContent = (rows: { value: string }[]): boolean =>
  rows.some((r) => r.value.trim().length > 0);

export const postFormSchema = z
  .object({
    /* ── company ── */
    companyMode: z.enum(["existing", "new"]),
    companyId: z.string(),
    name: z.string(),
    slug: z.string(),
    logoText: z.string(),
    logoBg: z.string(),
    logoFg: z.string(),
    size: z.string(),
    stage: z.string(),
    hq: z.string(),
    website: z.string(),
    oneLiner: z.string(), // → company.focus
    companyEcosystems: z.array(z.string()),
    /* ── job ── */
    title: z.string().trim().min(1, "Job title is required"),
    roleCategory: z.string().min(1, "Pick a role category"),
    seniority: z.enum(SENIORITIES),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    descriptionMd: z
      .string()
      .trim()
      .min(
        MIN_DESCRIPTION,
        `Description must be at least ${MIN_DESCRIPTION} characters`,
      ),
    responsibilities: z
      .array(listRow)
      .refine(hasContent, "Add at least one responsibility"),
    requirements: z
      .array(listRow)
      .refine(hasContent, "Add at least one requirement"),
    niceToHave: z.array(listRow),
    skills: z.array(listRow),
    salaryMin: z.string().regex(INT_RE, "Enter a whole-dollar amount"),
    salaryMax: z.string().regex(INT_RE, "Enter a whole-dollar amount"),
    salaryCurrency: z.enum(CURRENCIES),
    hasTokenEquity: z.boolean(),
    location: z.string().min(1, "Pick a location"),
    jobEcosystems: z.array(z.string()).min(1, "Pick at least one ecosystem"),
    applyUrl: z.string(),
    applyEmail: z.string(),
    /* ── review ── */
    isFeatured: z.boolean(),
  })
  .superRefine((data, ctx) => {
    /* company — rules depend on whether it is new or existing */
    if (data.companyMode === "existing") {
      if (!data.companyId)
        ctx.addIssue({
          code: "custom",
          path: ["companyId"],
          message: "Select a company",
        });
    } else {
      if (data.name.trim().length < 2)
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Company name is required",
        });
      if (!SLUG_RE.test(data.slug))
        ctx.addIssue({
          code: "custom",
          path: ["slug"],
          message: "Lowercase letters, numbers, and hyphens only",
        });
      const logo = data.logoText.trim().length;
      if (logo < 1 || logo > 3)
        ctx.addIssue({
          code: "custom",
          path: ["logoText"],
          message: "1–3 characters",
        });
      if (!data.size.trim())
        ctx.addIssue({
          code: "custom",
          path: ["size"],
          message: "Team size is required",
        });
      if (!data.stage)
        ctx.addIssue({
          code: "custom",
          path: ["stage"],
          message: "Pick a funding stage",
        });
      if (data.companyEcosystems.length < 1)
        ctx.addIssue({
          code: "custom",
          path: ["companyEcosystems"],
          message: "Pick at least one ecosystem",
        });
      if (data.website && !isUrl(data.website))
        ctx.addIssue({
          code: "custom",
          path: ["website"],
          message: "Enter a valid URL (https://…)",
        });
    }

    /* salary range */
    if (
      INT_RE.test(data.salaryMin) &&
      INT_RE.test(data.salaryMax) &&
      Number(data.salaryMin) >= Number(data.salaryMax)
    )
      ctx.addIssue({
        code: "custom",
        path: ["salaryMax"],
        message: "Maximum must be greater than minimum",
      });

    /* apply — exactly-or-at-least one of url / email, both well-formed */
    if (data.applyUrl && !isUrl(data.applyUrl))
      ctx.addIssue({
        code: "custom",
        path: ["applyUrl"],
        message: "Enter a valid URL (https://…)",
      });
    if (data.applyEmail && !EMAIL_RE.test(data.applyEmail))
      ctx.addIssue({
        code: "custom",
        path: ["applyEmail"],
        message: "Enter a valid email",
      });
    if (!data.applyUrl.trim() && !data.applyEmail.trim())
      ctx.addIssue({
        code: "custom",
        path: ["applyUrl"],
        message: "Provide an apply URL or email",
      });
  });

export type PostForm = z.infer<typeof postFormSchema>;

/** A LOCATION_OPTIONS value → the stored `location` string + `remoteScope`. */
export function resolveLocation(value: string): {
  location: string;
  remoteScope: string;
} {
  const scope =
    LOCATION_OPTIONS.find((o) => o.value === value)?.scope ?? "Worldwide";
  return { location: `Remote — ${scope}`, remoteScope: scope };
}
