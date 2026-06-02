/**
 * Data-driven FAQ for the programmatic collection pages (P16 AEO surface).
 *
 * Every answer is computed from the live job set the page already loaded — no
 * hand-written prose, nothing that can go stale. The same Q&A is rendered
 * visibly on the page AND emitted as FAQPage JSON-LD, so it satisfies Google's
 * "structured data must match visible content" rule and gives answer engines
 * (ChatGPT, Perplexity, Claude, AI Overviews) ready-to-cite Q&A pairs — the
 * AEO wedge.
 */
import type { JobWithCompany } from "@/db/queries";
import { formatSalary } from "@/lib/format";

export type FaqItem = { q: string; a: string };

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function isRemote(job: JobWithCompany): boolean {
  return Boolean(job.remoteScope) || /remote/i.test(job.location ?? "");
}

export function buildCollectionFaq(opts: {
  /** Noun phrase for the set, e.g. "Smart Contracts", "Ethereum engineering", "Ethereum Smart Contracts". */
  noun: string;
  jobs: JobWithCompany[];
  total: number;
  /** Optional cross-dimension breakdown — ecosystems for a role page, disciplines for an ecosystem page. */
  breakdown?: { question: string; items: { label: string; count: number }[] };
}): FaqItem[] {
  const { noun, jobs, total } = opts;
  if (total === 0) return [];

  const companies = new Set(jobs.map((j) => j.company.name)).size;
  const items: FaqItem[] = [];

  // 1) Inventory
  items.push({
    q: `How many ${noun} jobs are open right now?`,
    a: `There ${total === 1 ? "is" : "are"} ${total} live ${noun} ${
      total === 1 ? "role" : "roles"
    } across ${companies} ${
      companies === 1 ? "company" : "companies"
    } on chainwork, ingested daily from real ATS feeds (Ashby, Greenhouse, Lever).`,
  });

  // 2) Pay
  const disclosedMin = jobs.map((j) => j.salaryMin).filter((n) => n > 0);
  const disclosedMax = jobs.map((j) => j.salaryMax).filter((n) => n > 0);
  const disclosedCount = jobs.filter(
    (j) => j.salaryMin > 0 || j.salaryMax > 0,
  ).length;
  if (disclosedCount >= 3) {
    const band = formatSalary(median(disclosedMin), median(disclosedMax));
    const top = Math.max(...disclosedMax);
    items.push({
      q: `What do ${noun} jobs pay?`,
      a: `${disclosedCount} of the ${total} roles publish a salary range; the typical band is ${band}, reaching ${formatSalary(
        0,
        top,
      )} at the top. chainwork sorts salary-transparent roles first.`,
    });
  } else {
    items.push({
      q: `What do ${noun} jobs pay?`,
      a: `Most ${noun} roles here negotiate pay privately — ${disclosedCount} of ${total} publish a salary range. chainwork surfaces a public range wherever the company discloses one.`,
    });
  }

  // 3) Cross-dimension breakdown
  if (opts.breakdown && opts.breakdown.items.length) {
    const top = opts.breakdown.items.slice(0, 3);
    const phrase = top.map((t) => `${t.label} (${t.count})`).join(", ");
    items.push({
      q: opts.breakdown.question,
      a: `${phrase} have the most open ${noun} roles right now.`,
    });
  }

  // 4) Remote
  const remote = jobs.filter(isRemote).length;
  const pct = Math.round((remote / total) * 100);
  items.push({
    q: `Are ${noun} jobs remote?`,
    a: `${remote} of the ${total} (${pct}%) are remote-friendly. Filter the full list by ecosystem, discipline, and pay on chainwork.`,
  });

  return items;
}

/** FAQPage node (no @context — meant to sit inside a collection @graph). */
export function buildFaqPageJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
