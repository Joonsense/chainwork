import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { GlassNav } from "@/components/layout/glass-nav";
import { getAllJobs } from "@/db/queries";
import {
  ROLE_COLLECTIONS,
  ECO_COLLECTIONS,
  ecoCounts,
  roleCounts,
} from "@/lib/collections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Directory — every crypto engineering role by discipline & ecosystem",
  description:
    "Browse every open AI × crypto engineering role by discipline (smart contracts, protocol, ZK, security) and by ecosystem (Ethereum, Solana, Bitcoin, and more). Salary-transparent, indexed daily.",
  alternates: { canonical: "/directory" },
};

function CountLink({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group flex items-center justify-between gap-3 rounded-xl border border-subtle bg-glass px-4 py-3 transition-colors hover:border-line hover:bg-glass-hi"
    >
      <span className="text-[14px] font-medium text-text-primary">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-text-tertiary">{count}</span>
        <ArrowRight
          size={13}
          className="text-text-muted transition-colors group-hover:text-text-primary"
        />
      </span>
    </Link>
  );
}

export default async function DirectoryPage() {
  const jobs = await getAllJobs();
  const eco = ecoCounts(jobs);
  const role = roleCounts(jobs);

  // Combination matrix — only populated cells become a citeable page.
  const comboKey = (cat: string, key: string) => `${cat}|${key}`;
  const comboMap: Record<string, number> = {};
  for (const j of jobs) {
    for (const e of j.ecosystems) {
      const k = comboKey(j.roleCategory, e);
      comboMap[k] = (comboMap[k] ?? 0) + 1;
    }
  }

  const populatedCombos = ROLE_COLLECTIONS.flatMap((r) =>
    ECO_COLLECTIONS.map((e) => ({
      role: r,
      eco: e,
      count: comboMap[comboKey(r.category, e.key)] ?? 0,
    })),
  )
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const roleLive = ROLE_COLLECTIONS.filter((r) => role[r.category] > 0);
  const ecoLive = ECO_COLLECTIONS.filter((e) => eco[e.key] > 0);

  return (
    <div className="min-h-dvh">
      <GlassNav />

      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />

        <div className="relative mx-auto max-w-[920px] px-5 pb-16 pt-4 md:pt-6">
          <nav className="flex items-center gap-1.5 font-mono text-[11px] text-text-tertiary">
            <Link href="/" prefetch={false} className="hover:text-text-secondary">
              chainwork
            </Link>
            <ChevronRight size={11} className="text-text-muted" />
            <span className="text-text-secondary">Directory</span>
          </nav>

          <h1 className="mt-5 text-[26px] font-semibold leading-[1.12] tracking-[-0.025em] text-text-primary md:text-[34px]">
            The crypto engineering directory
          </h1>
          <p className="mt-3 max-w-[680px] text-[14.5px] leading-[1.6] text-text-secondary">
            Every open AI × crypto engineering role, organised by discipline and
            by ecosystem. {jobs.length} live roles, salary-transparent and
            indexed daily from real ATS feeds. Pick a slice below.
          </p>

          {/* roles */}
          <section className="mt-10">
            <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
              By discipline
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {roleLive.map((r) => (
                <CountLink
                  key={r.slug}
                  href={`/roles/${r.slug}`}
                  label={`${r.label} jobs`}
                  count={role[r.category]}
                />
              ))}
            </div>
          </section>

          {/* ecosystems */}
          <section className="mt-10">
            <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
              By ecosystem
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {ecoLive.map((e) => (
                <CountLink
                  key={e.slug}
                  href={`/ecosystems/${e.slug}`}
                  label={`${e.name} jobs`}
                  count={eco[e.key]}
                />
              ))}
            </div>
          </section>

          {/* combinations */}
          {populatedCombos.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
                Discipline × ecosystem
              </h2>
              <ul className="flex flex-wrap gap-2">
                {populatedCombos.map((c) => (
                  <li key={`${c.role.slug}-${c.eco.slug}`}>
                    <Link
                      href={`/roles/${c.role.slug}/${c.eco.slug}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-glass px-3 py-1.5 text-[12.5px] text-text-secondary transition-colors hover:border-line hover:text-text-primary"
                    >
                      {c.eco.name} {c.role.label}
                      <span className="font-mono text-[10.5px] text-text-tertiary">
                        {c.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
