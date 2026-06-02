import { z } from "zod";
import {
  ROLE_CATEGORIES,
  SENIORITIES,
  EMPLOYMENT_TYPES,
  CURRENCIES,
} from "@/lib/post-schema";
import { ECOSYSTEM_OPTIONS, LOCATION_OPTIONS } from "@/lib/jobs-search-params";

/**
 * Validation for the PUBLIC /submit form. Leaner than the authed /post
 * wizard: no company-logo picking (auto-derived on publish), salary is
 * optional (0 = undisclosed), and a submitter email is required so we can
 * follow up. Shared by the client form (zodResolver) and the server action
 * (re-validated, never trusted).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INT_RE = /^\d+$/;
const isUrl = (v: string): boolean => {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
};

/** Lower bar than /post (200) — public submissions, but still enough body
 *  to make a real, indexable page rather than a thin stub. */
export const SUBMISSION_MIN_DESCRIPTION = 120;

const LOC_VALUES = LOCATION_OPTIONS.map((o) => o.value);

export const submissionSchema = z
  .object({
    submitterEmail: z.string().trim(),
    companyName: z.string().trim(),
    companyWebsite: z.string().trim(),
    title: z.string().trim().min(1, "Job title is required"),
    roleCategory: z.string().min(1, "Pick a role category"),
    seniority: z.enum(SENIORITIES),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    ecosystems: z.array(z.string()).min(1, "Pick at least one ecosystem"),
    location: z.string().min(1, "Pick a location"),
    salaryMin: z.string().trim(),
    salaryMax: z.string().trim(),
    salaryCurrency: z.enum(CURRENCIES),
    hasTokenEquity: z.boolean(),
    descriptionMd: z
      .string()
      .trim()
      .min(
        SUBMISSION_MIN_DESCRIPTION,
        `Description must be at least ${SUBMISSION_MIN_DESCRIPTION} characters`,
      ),
    applyUrl: z.string().trim(),
    applyEmail: z.string().trim(),
    note: z.string().trim(),
  })
  .superRefine((d, ctx) => {
    if (!EMAIL_RE.test(d.submitterEmail))
      ctx.addIssue({
        code: "custom",
        path: ["submitterEmail"],
        message: "Enter a valid email",
      });

    if (d.companyName.length < 2)
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "Company name is required",
      });

    if (d.companyWebsite && !isUrl(d.companyWebsite))
      ctx.addIssue({
        code: "custom",
        path: ["companyWebsite"],
        message: "Enter a valid URL (https://…)",
      });

    if (!ROLE_CATEGORIES.includes(d.roleCategory))
      ctx.addIssue({
        code: "custom",
        path: ["roleCategory"],
        message: "Pick a role category",
      });

    for (const e of d.ecosystems) {
      if (!ECOSYSTEM_OPTIONS.includes(e)) {
        ctx.addIssue({
          code: "custom",
          path: ["ecosystems"],
          message: "Invalid ecosystem",
        });
        break;
      }
    }

    if (!LOC_VALUES.includes(d.location))
      ctx.addIssue({
        code: "custom",
        path: ["location"],
        message: "Pick a location",
      });

    // Salary — optional, but if given must be whole numbers with min < max.
    const hasMin = d.salaryMin.length > 0;
    const hasMax = d.salaryMax.length > 0;
    if (hasMin && !INT_RE.test(d.salaryMin))
      ctx.addIssue({
        code: "custom",
        path: ["salaryMin"],
        message: "Whole-dollar amount only",
      });
    if (hasMax && !INT_RE.test(d.salaryMax))
      ctx.addIssue({
        code: "custom",
        path: ["salaryMax"],
        message: "Whole-dollar amount only",
      });
    if (
      hasMin &&
      hasMax &&
      INT_RE.test(d.salaryMin) &&
      INT_RE.test(d.salaryMax) &&
      Number(d.salaryMin) >= Number(d.salaryMax)
    )
      ctx.addIssue({
        code: "custom",
        path: ["salaryMax"],
        message: "Maximum must be greater than minimum",
      });

    // Apply — at least one of url / email, both well-formed when present.
    if (d.applyUrl && !isUrl(d.applyUrl))
      ctx.addIssue({
        code: "custom",
        path: ["applyUrl"],
        message: "Enter a valid URL (https://…)",
      });
    if (d.applyEmail && !EMAIL_RE.test(d.applyEmail))
      ctx.addIssue({
        code: "custom",
        path: ["applyEmail"],
        message: "Enter a valid email",
      });
    if (!d.applyUrl && !d.applyEmail)
      ctx.addIssue({
        code: "custom",
        path: ["applyUrl"],
        message: "Provide an apply URL or email",
      });
  });

export type SubmissionForm = z.infer<typeof submissionSchema>;
