import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Neon serverless client + Drizzle instance.
 * Next.js loads DATABASE_URL from .env automatically; the seed script
 * and drizzle-kit load it via `dotenv/config`.
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle({ client: sql, schema });

export * from "./schema";
