import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db, jobs } from "./index";

/**
 * P17 - LLM classification pass over the whole catalogue.
 *
 * The regex filter (P16.1) is high-precision but can't converge on the long
 * tail of ambiguous non-engineering titles (Project Manager, Payroll, Customer
 * Care, Securities-Platform Specialist, Technical Support, ...). Claude reads
 * every title and decides keep/drop + the best role_category. Conservative by
 * construction: dry-run prints every proposed delete and every category change
 * for review; only --apply mutates prod.
 *
 *   pnpm tsx src/db/llm-classify-roles.ts            (dry run, default)
 *   pnpm tsx src/db/llm-classify-roles.ts --apply    (write changes)
 */

const CATEGORIES = [
  "Protocol",
  "Smart Contracts",
  "ZK / Cryptography",
  "AI x Crypto",
  "Frontend",
  "Backend",
  "Infra / DevOps",
  "Security & Audit",
  "DevRel",
  "Research",
];

const SYSTEM = [
  "You classify job postings for chainwork, a board EXCLUSIVELY for AI x crypto / web3 ENGINEERING roles.",
  "For each posting decide two things:",
  "1) keep (boolean): is this a hands-on engineering / technical individual-contributor role, OR an engineering-management role (manager/lead/director/VP OF an engineering team)?",
  "   KEEP: software/backend/frontend/mobile/full-stack engineers, smart-contract & protocol devs, infra/devops/SRE, security engineers & smart-contract auditors, ZK/cryptography engineers & researchers, ML/AI engineers, data engineers, developer-relations / developer-advocate, QA/test (SDET), engineering managers/leads/directors/VPs of engineering.",
  "   DROP (keep=false): sales, business development, partnerships, marketing, growth, demand-gen, content/SEO, social/community, (non-engineering) design/UX-research, product managers, project & program managers (non-eng, incl. TPM unless clearly eng), finance/accounting/FP&A/treasury, HR/people/recruiting/talent, legal/compliance, general operations/biz-ops/strategy, customer success/support/customer-care, executive/general-manager/chief-revenue, business/risk/fraud/KYC/AML analysts, professional-services consultants, payroll, media/video.",
  "2) category (string): if keep, the single best fit from this exact set: " + CATEGORIES.join(", ") + ". Use 'Backend' as the generic engineering catch-all when no other fits.",
  "Output ONLY a JSON array, one object per posting in the SAME order, shaped exactly: [{\"i\":0,\"keep\":true,\"category\":\"Backend\"},{\"i\":1,\"keep\":false,\"category\":null}]. No prose, no markdown fences.",
].join("\n");

type Row = { id: string; title: string; oneLiner: string | null; category: string; company: string };
type Verdict = { i: number; keep: boolean; category: string | null };

async function classifyBatch(
  client: Anthropic,
  batch: Row[],
): Promise<Verdict[]> {
  const lines = batch
    .map((r, i) => i + ". " + r.title + " | " + r.company + (r.oneLiner ? " | " + r.oneLiner : ""))
    .join("\n");

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "disabled" },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: "Classify these " + batch.length + " postings (index | title | company | one-liner):\n\n" + lines,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text : "[]";
  const json = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
  return JSON.parse(json) as Verdict[];
}

async function main() {
  const apply = process.argv.includes("--apply");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const rows: Row[] = (
    await db
      .select({
        id: jobs.id,
        title: jobs.title,
        oneLiner: jobs.oneLiner,
        category: jobs.roleCategory,
      })
      .from(jobs)
  ).map((r) => ({ ...r, company: "" }));

  // Attach company name for context (single join-free pass).
  const { companies } = await import("./schema");
  const companyRows = await db.select({ id: companies.id, name: companies.name }).from(companies);
  // Re-query with company via the existing relation would be cleaner; keep it simple:
  const withCo = await db
    .select({ id: jobs.id, companyId: jobs.companyId })
    .from(jobs);
  const coName = new Map(companyRows.map((c) => [c.id, c.name]));
  const jobCo = new Map(withCo.map((j) => [j.id, coName.get(j.companyId) ?? ""]));
  for (const r of rows) r.company = jobCo.get(r.id) ?? "";

  const BATCH = 60;
  const verdicts: { row: Row; v: Verdict }[] = [];
  for (let start = 0; start < rows.length; start += BATCH) {
    const batch = rows.slice(start, start + BATCH);
    const out = await classifyBatch(client, batch);
    for (const v of out) {
      const row = batch[v.i];
      if (row) verdicts.push({ row, v });
    }
    console.log("  classified " + Math.min(start + BATCH, rows.length) + "/" + rows.length);
  }

  const valid = new Set(CATEGORIES);
  const deletes = verdicts.filter((x) => x.v.keep === false);
  const recats = verdicts.filter(
    (x) =>
      x.v.keep !== false &&
      x.v.category &&
      valid.has(x.v.category) &&
      x.v.category !== x.row.category,
  );

  const before: Record<string, number> = {};
  for (const r of rows) before[r.category] = (before[r.category] ?? 0) + 1;
  const after: Record<string, number> = { ...before };
  for (const d of deletes) after[d.row.category] -= 1;
  for (const r of recats) {
    after[r.row.category] -= 1;
    after[r.v.category!] = (after[r.v.category!] ?? 0) + 1;
  }
  const fmt = (d: Record<string, number>) =>
    Object.entries(d)
      .filter(([, n]) => n !== 0)
      .sort((a, b) => b[1] - a[1])
      .map((e) => "  " + String(e[1]).padStart(4) + "  " + e[0])
      .join("\n");

  console.log("\nTotal: " + rows.length);
  console.log("DELETE (non-eng): " + deletes.length + "  |  RECATEGORIZE: " + recats.length + "\n");
  console.log("BEFORE:\n" + fmt(before));
  console.log("\nAFTER (projected, " + (rows.length - deletes.length) + " jobs):\n" + fmt(after));

  console.log("\nDELETES (" + deletes.length + "):");
  for (const d of deletes) console.log("  DROP [" + d.row.category + "] " + d.row.title);

  console.log("\nRECATEGORIZE (" + recats.length + "):");
  for (const r of recats)
    console.log("  " + r.row.category + " -> " + r.v.category!.padEnd(18) + " | " + r.row.title);

  if (!apply) {
    console.log("\n[DRY RUN] No changes written. Re-run with --apply to DROP " + deletes.length + " and recategorize " + recats.length + ".");
    return;
  }

  let dropped = 0;
  for (const d of deletes) {
    await db.delete(jobs).where(eq(jobs.id, d.row.id));
    dropped++;
  }
  let changed = 0;
  for (const r of recats) {
    await db.update(jobs).set({ roleCategory: r.v.category! }).where(eq(jobs.id, r.row.id));
    changed++;
  }
  console.log("\n[APPLIED] Dropped " + dropped + ", recategorized " + changed + ".");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
