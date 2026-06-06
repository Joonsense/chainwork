/**
 * Run the full ATS ingest once against the real DB (all providers/companies).
 * Usage: node --env-file=.env --import tsx scripts/run-ingest.ts
 */
import { runATSIngest } from "@/lib/ats/ingest";

runATSIngest()
  .then((r) => {
    console.log("Ingest done:", JSON.stringify(r, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
