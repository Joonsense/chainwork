import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendMagicLinkEmail } from "./email";

/**
 * Better-Auth (P8) — email magic link + GitHub OAuth, 30-day cookie
 * sessions. `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are read from the
 * environment.
 *
 * GitHub is registered only when its credentials are present, so the app
 * still boots without them (the magic-link path stays usable).
 */

const githubId = process.env.GITHUB_CLIENT_ID;
const githubSecret = process.env.GITHUB_CLIENT_SECRET;

/** Whether GitHub OAuth is wired — drives the sign-in UI. */
export const githubEnabled = Boolean(githubId && githubSecret);

export const auth = betterAuth({
  appName: "Chainwork",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // slide the expiry at most once a day
  },
  socialProviders: githubEnabled
    ? { github: { clientId: githubId!, clientSecret: githubSecret! } }
    : {},
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
    nextCookies(), // keep last — lets server actions set the session cookie
  ],
});

/** Current session for server components, route handlers, and actions. */
export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}
