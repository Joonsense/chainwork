/**
 * GitHub profile fetch (P10). Pulls a user's public repos — languages,
 * topics, and a few READMEs — into a text blob for skill extraction.
 *
 * Works unauthenticated (60 req/hr); an OAuth token raises the limit.
 */

const GH_HEADERS = (token?: string): Record<string, string> => ({
  "User-Agent": "chainwork",
  Accept: "application/vnd.github+json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count?: number;
  fork?: boolean;
};

export type GithubProfile = { username: string; text: string };

/** Resolves the GitHub username behind a stored OAuth access token. */
export async function githubUsernameFromToken(
  token: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: GH_HEADERS(token),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { login?: string };
    return data.login ?? null;
  } catch {
    return null;
  }
}

/** Fetches a public GitHub profile as a text blob for skill extraction. */
export async function fetchGithubProfile(
  username: string,
  token?: string,
): Promise<GithubProfile | null> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`,
      { headers: GH_HEADERS(token) },
    );
    if (!res.ok) return null;
    const repos = (await res.json()) as Repo[];
    if (!Array.isArray(repos) || repos.length === 0) return null;

    const top = repos
      .filter((r) => !r.fork)
      .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
      .slice(0, 12);

    const lines: string[] = [`GitHub profile: ${username}`, "", "Repositories:"];
    for (const r of top) {
      lines.push(
        `- ${r.name}: ${r.description ?? "(no description)"} ` +
          `[language: ${r.language ?? "unknown"}]` +
          (r.topics?.length ? ` [topics: ${r.topics.join(", ")}]` : ""),
      );
    }

    // A few README excerpts add real signal beyond language labels.
    for (const r of top.slice(0, 3)) {
      try {
        const rmRes = await fetch(
          `https://api.github.com/repos/${username}/${r.name}/readme`,
          { headers: GH_HEADERS(token) },
        );
        if (!rmRes.ok) continue;
        const data = (await rmRes.json()) as { content?: string };
        if (data.content) {
          const md = Buffer.from(data.content, "base64").toString("utf8");
          lines.push("", `README — ${r.name}:`, md.slice(0, 1400));
        }
      } catch {
        /* skip unreadable readmes */
      }
    }

    return { username, text: lines.join("\n") };
  } catch (err) {
    console.error(`GitHub fetch failed for ${username}:`, err);
    return null;
  }
}
