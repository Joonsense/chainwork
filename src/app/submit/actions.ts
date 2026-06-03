"use server";

import { db, jobSubmissions } from "@/db";
import { submissionSchema } from "@/lib/submission-schema";
import { importJobFromUrl, type ImportResult } from "@/lib/ats/import-url";

export type SubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Pre-fill the submission form from a pasted Greenhouse / Lever / Ashby job
 * link. Runs server-side (the ATS APIs need a server fetch, not the browser).
 * Returns the lean form fields; the client merges them into the form.
 */
export async function importFromUrl(url: string): Promise<ImportResult> {
  if (typeof url !== "string" || url.trim().length === 0) {
    return { ok: false, error: "Paste a job link first." };
  }
  return importJobFromUrl(url);
}

/**
 * Public job submission — no auth. The payload lands in `job_submissions`
 * with status "pending" and never touches the live `jobs` table until an
 * admin publishes it from /admin/submissions. Server re-validates the whole
 * payload — server actions are public POST endpoints, so the client schema
 * alone is not enough.
 */
export async function createSubmission(args: {
  data: unknown;
}): Promise<SubmitResult> {
  const parsed = submissionSchema.safeParse(args.data);
  if (!parsed.success) {
    return { ok: false, error: "Some fields are invalid. Review and retry." };
  }
  const f = parsed.data;

  try {
    await db.insert(jobSubmissions).values({
      status: "pending",
      submitterEmail: f.submitterEmail.trim().toLowerCase(),
      data: f,
      note: f.note.trim() || null,
    });
    return { ok: true };
  } catch (err) {
    console.error("createSubmission failed:", err);
    return { ok: false, error: "Something went wrong. Try again." };
  }
}
