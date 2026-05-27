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
  hq: text("hq"), // headquarters / base location, e.g. "Remote-first"
  ecosystems: jsonb("ecosystems").$type<string[]>().notNull().default([]),
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
    /* when a paid Featured slot lapses (P9) — the expiry cron clears
       is_featured once this passes; null for never-featured rows */
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    isSponsored: boolean("is_sponsored").notNull().default(false),
    isVerified: boolean("is_verified").notNull().default(false),
    applyUrl: text("apply_url"), // external careers page
    applyEmail: text("apply_email"), // mailto fallback when no apply_url
    applyCount: integer("apply_count").notNull().default(0),
    /* ATS ingest (P11) — source + external_id power deduplication */
    source: text("source").notNull().default("manual"), // "manual" | "greenhouse" | "lever" | "seed"
    externalId: text("external_id"), // ATS job ID; null for manual/seed rows
    /* viral mechanics (P11) */
    viewCount: integer("view_count").notNull().default(0),
    /* the signed-in user who posted this job (P8) — null for seeded rows */
    postedBy: text("posted_by").references(() => users.id, {
      onDelete: "set null",
    }),
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
    index("jobs_view_count_idx").on(t.viewCount),
  ],
);

/* ── job_alerts ─────────────────────────────────────────────── */
export const jobAlerts = pgTable(
  "job_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /* set when a signed-in user subscribes — powers "your alerts" (P9) */
    userId: text("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    query: text("query"), // free-text search the alert watches
    filters: jsonb("filters")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    frequency: text("frequency").notNull().default("daily"), // realtime · daily · weekly
    channels: jsonb("channels").$type<string[]>().notNull().default(["email"]),
    /* double opt-in (P9) — `token` powers both confirm and unsubscribe */
    verified: boolean("verified").notNull().default(false),
    token: text("token").notNull().unique(),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
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
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
  /* the signed-in user this profile belongs to (P10) */
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  githubUsername: text("github_username"),
  headline: text("headline"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  /* AI-extracted skills + ecosystems for job matching (P10) */
  extractedSkills: jsonb("extracted_skills")
    .$type<string[]>()
    .notNull()
    .default([]),
  preferredEcosystems: jsonb("preferred_ecosystems")
    .$type<string[]>()
    .notNull()
    .default([]),
  indexSource: text("index_source"), // "github" · "cv"
  lastIndexedAt: timestamp("last_indexed_at", { withTimezone: true }),
  resumeUrl: text("resume_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ── Better-Auth tables (P8) ─────────────────────────────────────
 * Shapes match Better-Auth 1.6's expected schema. The drizzle adapter
 * runs with `usePlural`, so model `user` → table `users`, etc.
 * Better-Auth owns these rows: it generates the string ids and writes
 * the created/updated timestamps itself. */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/* ── inferred types ─────────────────────────────────────────── */
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobAlert = typeof jobAlerts.$inferSelect;
export type NewJobAlert = typeof jobAlerts.$inferInsert;
export type SavedJob = typeof savedJobs.$inferSelect;
export type CandidateProfile = typeof candidateProfiles.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
