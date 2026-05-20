import { and, eq } from "drizzle-orm";
import { db, candidateProfiles, accounts } from "@/db";
import type { MatchProfile } from "./matching";
import { fetchGithubProfile, githubUsernameFromToken } from "./github";
import { extractSkills, type ExtractedProfile } from "./anthropic";

/**
 * Candidate-profile indexing (P10). A profile is (re)built from GitHub at
 * most once a day; CV-sourced profiles are refreshed only on re-upload.
 */

const STALE_MS = 24 * 60 * 60 * 1000;

export type SessionUser = { id: string; email: string; name?: string | null };

export type IndexedProfile = MatchProfile & {
  source: "github" | "cv" | null;
  username: string | null;
  indexedAt: Date | null;
};

export type MatchProfileResult =
  | { status: "ready"; profile: IndexedProfile }
  | { status: "no-source" };

function toIndexed(row: typeof candidateProfiles.$inferSelect): IndexedProfile {
  return {
    skills: row.extractedSkills,
    ecosystems: row.preferredEcosystems,
    source: (row.indexSource as "github" | "cv" | null) ?? null,
    username: row.githubUsername,
    indexedAt: row.lastIndexedAt,
  };
}

/** The user's stored profile, no indexing — used by the /jobs fit sort. */
export async function getStoredProfile(
  userId: string,
): Promise<MatchProfile | null> {
  const [row] = await db
    .select()
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, userId))
    .limit(1);
  if (!row || row.extractedSkills.length === 0) return null;
  return { skills: row.extractedSkills, ecosystems: row.preferredEcosystems };
}

/** Writes an extracted profile (shared by the GitHub and CV paths). */
export async function saveProfile(
  user: SessionUser,
  extracted: ExtractedProfile,
  meta: { source: "github" | "cv"; githubUsername?: string; resumeUrl?: string },
): Promise<void> {
  const [existing] = await db
    .select({ id: candidateProfiles.id })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, user.id))
    .limit(1);

  const values = {
    userId: user.id,
    email: user.email,
    displayName: user.name ?? null,
    githubUsername: meta.githubUsername ?? null,
    extractedSkills: extracted.skills,
    preferredEcosystems: extracted.ecosystems,
    indexSource: meta.source,
    lastIndexedAt: new Date(),
    ...(meta.resumeUrl ? { resumeUrl: meta.resumeUrl } : {}),
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(candidateProfiles)
      .set(values)
      .where(eq(candidateProfiles.id, existing.id));
  } else {
    await db.insert(candidateProfiles).values(values);
  }
}

/**
 * Loads the user's match profile, (re)indexing from GitHub when it is
 * missing or stale. CV-only profiles are returned as-is (no auto-refresh).
 */
export async function getMatchProfile(
  user: SessionUser,
): Promise<MatchProfileResult> {
  const [profile] = await db
    .select()
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, user.id))
    .limit(1);

  const fresh =
    profile?.lastIndexedAt &&
    Date.now() - profile.lastIndexedAt.getTime() < STALE_MS;
  if (profile && fresh && profile.extractedSkills.length > 0) {
    return { status: "ready", profile: toIndexed(profile) };
  }

  // Resolve a GitHub username — from the stored profile, or via OAuth token.
  const [ghAccount] = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.userId, user.id), eq(accounts.providerId, "github")),
    )
    .limit(1);
  const token = ghAccount?.accessToken ?? undefined;
  let username = profile?.githubUsername ?? null;
  if (!username && token) username = await githubUsernameFromToken(token);

  // No GitHub source — keep any prior (e.g. CV-indexed) profile, else none.
  if (!username) {
    if (profile && profile.extractedSkills.length > 0) {
      return { status: "ready", profile: toIndexed(profile) };
    }
    return { status: "no-source" };
  }

  const github = await fetchGithubProfile(username, token);
  if (!github) {
    if (profile && profile.extractedSkills.length > 0) {
      return { status: "ready", profile: toIndexed(profile) };
    }
    return { status: "no-source" };
  }

  const extracted = await extractSkills(github.text);
  await saveProfile(user, extracted, {
    source: "github",
    githubUsername: username,
  });

  return {
    status: "ready",
    profile: {
      skills: extracted.skills,
      ecosystems: extracted.ecosystems,
      source: "github",
      username,
      indexedAt: new Date(),
    },
  };
}
