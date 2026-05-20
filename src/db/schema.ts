import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Chainwork DB schema (Drizzle / Postgres / Neon).
 *
 * No authoritative spec §3 existed, so this is derived from the v2 mockup
 * data shapes (reference data.jsx) plus standard job-board needs. Five
 * tables: companies, jobs, job_alerts, saved_jobs, candidate_profiles.
 */

/* ── companies ──────────────────────────────────────────────── */
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /* monogram lockup — e.g. "HL" on a colored square */
  logoText: text("logo_text").notNull(),
  logoBg: text("logo_bg").notNull(),
  logoFg: text("logo_fg").notNull(),
  stage: text("stage"), // Seed, Series A/B, Bootstrapped …
  size: text("size"), // employee range, e.g. "60–120"
  focus: text("focus"), // one-line description of what they build
  website: text("website"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ── jobs ───────────────────────────────────────────────────── */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    descriptionMd: text("description_md").notNull(),
    responsibilities: jsonb("responsibilities")
      .$type<string[]>()
      .notNull()
      .default([]),
    requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
    niceToHave: jsonb("nice_to_have").$type<string[]>().notNull().default([]),
    oneLiner: text("one_liner"), // short summary for meta description
    roleCategory: text("role_category").notNull(), // 9 categories
    seniority: text("seniority").notNull(), // Junior · Mid · Senior · Staff · Principal
    employmentType: text("employment_type").notNull(), // Full-time · Contract
    location: text("location").notNull(),
    remoteScope: text("remote_scope"), // Worldwide · Americas · Europe · APAC · EMEA
    salaryMin: integer("salary_min").notNull(),
    salaryMax: integer("salary_max").notNull(),
    salaryCurrency: text("salary_currency").notNull().default("USD"),
    hasTokenEquity: boolean("has_token_equity").notNull().default(false),
    ecosystems: jsonb("ecosystems").$type<string[]>().notNull().default([]),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    isFeatured: boolean("is_featured").notNull().default(false),
    isSponsored: boolean("is_sponsored").notNull().default(false),
    isVerified: boolean("is_verified").notNull().default(false),
    applyUrl: text("apply_url"), // external careers page
    applyEmail: text("apply_email"), // mailto fallback when no apply_url
    applyCount: integer("apply_count").notNull().default(0),
    /* schema.org JobPosting — precomputed at write time, dropped straight
       into <head> on render so it never gets rebuilt per request. */
    jsonLd: jsonb("json_ld").$type<Record<string, unknown>>().notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull(),
    indexedAt: timestamp("indexed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("jobs_posted_at_idx").on(t.postedAt.desc()),
    index("jobs_company_id_idx").on(t.companyId),
    index("jobs_is_featured_idx").on(t.isFeatured),
    index("jobs_role_category_idx").on(t.roleCategory),
    index("jobs_seniority_idx").on(t.seniority),
  ],
);

/* ── job_alerts ─────────────────────────────────────────────── */
export const jobAlerts = pgTable(
  "job_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    query: text("query"), // free-text search the alert watches
    filters: jsonb("filters")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    frequency: text("frequency").notNull().default("real-time"), // real-time · daily · weekly
    channels: jsonb("channels").$type<string[]>().notNull().default(["email"]),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("job_alerts_email_idx").on(t.email)],
);

/* ── saved_jobs ─────────────────────────────────────────────── */
export const savedJobs = pgTable(
  "saved_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(), // opaque identifier until auth lands
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("saved_jobs_job_user_idx").on(t.jobId, t.userId),
    index("saved_jobs_user_id_idx").on(t.userId),
  ],
);

/* ── candidate_profiles ─────────────────────────────────────── */
export const candidateProfiles = pgTable("candidate_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  githubUsername: text("github_username"),
  headline: text("headline"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  resumeUrl: text("resume_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ── inferred types ─────────────────────────────────────────── */
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobAlert = typeof jobAlerts.$inferSelect;
export type SavedJob = typeof savedJobs.$inferSelect;
export type CandidateProfile = typeof candidateProfiles.$inferSelect;
