/**
 * P0 — Design system check page.
 *
 * Renders the full spec §2.3 type scale and the §2.1 color tokens so the
 * token → Tailwind-utility pipeline can be verified by eye. Every swatch
 * uses a real Tailwind utility class (bg-base, text-h1, …), so if it
 * renders correctly the pipeline is wired. This page is overwritten in P2.
 */

type TypeRow = {
  name: string;
  spec: string;
  cls: string;
  sample: string;
};

const typeScale: TypeRow[] = [
  { name: "h1", spec: "56 / 1.04 / -0.035em / 600", cls: "text-h1 text-text-primary", sample: "Onchain work." },
  { name: "h2", spec: "26 / 1.15 / -0.025em / 600", cls: "text-h2 text-text-primary", sample: "Senior Protocol Engineer" },
  { name: "h3", spec: "16 / 1.3 / -0.015em / 600", cls: "text-h3 text-text-primary", sample: "Helix Labs · Remote" },
  {
    name: "body-lg",
    spec: "15 / 1.6",
    cls: "text-body-lg text-text-secondary",
    sample: "Lead copy for intros and section openers — large enough to set a paragraph apart.",
  },
  {
    name: "body",
    spec: "14 / 1.6",
    cls: "text-body text-text-secondary",
    sample: "Default body copy. The workhorse size for descriptions, lists, and form text across the app.",
  },
  {
    name: "caption",
    spec: "12 / 1.45",
    cls: "text-caption text-text-tertiary",
    sample: "Posted 3h ago · 47 applicants · indexed 14s ago",
  },
  {
    name: "eyebrow",
    spec: "10.5 / 0.06em / mono",
    cls: "text-eyebrow font-mono uppercase text-text-tertiary",
    sample: "Verified company",
  },
];

type Swatch = { token: string; value: string; cls: string };

const surfaces: Swatch[] = [
  { token: "base", value: "#08080b", cls: "bg-base" },
  { token: "surface", value: "#0c0c10", cls: "bg-surface" },
  { token: "surface-2", value: "#111116", cls: "bg-surface-2" },
  { token: "surface-3", value: "#16161d", cls: "bg-surface-3" },
  { token: "elevated", value: "#1c1c25", cls: "bg-elevated" },
  { token: "glass-hi", value: "rgba white .06", cls: "bg-glass-hi" },
];

const textTokens: Swatch[] = [
  { token: "text-primary", value: "#f5f5f7", cls: "bg-text-primary" },
  { token: "text-bright", value: "#ededf0", cls: "bg-text-bright" },
  { token: "text-secondary", value: "white 62%", cls: "bg-text-secondary" },
  { token: "text-tertiary", value: "white 42%", cls: "bg-text-tertiary" },
  { token: "text-muted", value: "white 26%", cls: "bg-text-muted" },
];

const accents: Swatch[] = [
  { token: "accent-blue", value: "oklch .72 .16 250", cls: "bg-accent-blue" },
  { token: "accent-blue-deep", value: "oklch .62 .18 250", cls: "bg-accent-blue-deep" },
  { token: "accent-purple", value: "oklch .68 .20 295", cls: "bg-accent-purple" },
  { token: "accent-cyan", value: "oklch .82 .13 200", cls: "bg-accent-cyan" },
  { token: "accent-green", value: "oklch .78 .16 155", cls: "bg-accent-green" },
  { token: "accent-amber", value: "oklch .78 .16 75", cls: "bg-accent-amber" },
  { token: "accent-pink", value: "oklch .72 .22 350", cls: "bg-accent-pink" },
  { token: "gradient-brand", value: "blue → purple 135°", cls: "bg-gradient-brand" },
];

const borders: Swatch[] = [
  { token: "subtle", value: "white 6%", cls: "border-subtle" },
  { token: "line", value: "white 10%", cls: "border-line" },
  { token: "strong", value: "white 14%", cls: "border-strong" },
];

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-3">
      <span className="font-mono text-eyebrow uppercase text-accent-blue">{index}</span>
      <h2 className="text-h3 text-text-primary">{title}</h2>
    </div>
  );
}

function ColorSwatch({ token, value, cls }: Swatch) {
  return (
    <div className="overflow-hidden rounded-lg border border-subtle bg-surface">
      <div className={`h-14 ${cls}`} />
      <div className="border-t border-subtle px-2.5 py-2">
        <div className="truncate font-mono text-[11px] text-text-secondary">{token}</div>
        <div className="truncate font-mono text-[10px] text-text-muted">{value}</div>
      </div>
    </div>
  );
}

function BorderSwatch({ token, value, cls }: Swatch) {
  return (
    <div className="overflow-hidden rounded-lg border border-subtle bg-surface">
      <div className="p-2">
        <div className={`h-[42px] rounded-md border-2 bg-base ${cls}`} />
      </div>
      <div className="border-t border-subtle px-2.5 py-2">
        <div className="truncate font-mono text-[11px] text-text-secondary">border-{token}</div>
        <div className="truncate font-mono text-[10px] text-text-muted">{value}</div>
      </div>
    </div>
  );
}

export default function DesignSystemCheck() {
  return (
    <main className="min-h-dvh bg-base">
      <div className="h-px w-full bg-gradient-brand" />

      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        {/* Header */}
        <header>
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-md bg-gradient-brand shadow-[0_0_16px_-2px_oklch(0.6_0.18_270/0.6)]" />
            <span className="font-mono text-eyebrow uppercase tracking-widest text-text-tertiary">
              Chainwork · P0
            </span>
          </div>
          <h1 className="mt-6 text-h1 text-text-primary">Design system check</h1>
          <p className="mt-4 max-w-xl text-body-lg text-text-secondary">
            Dark-native v2 tokens, wired into Tailwind. Typography in{" "}
            <span className="text-text-primary">Inter</span>, mono in{" "}
            <span className="font-mono text-text-primary">JetBrains Mono</span>. This page is
            scaffolding — replaced in P2.
          </p>
        </header>

        {/* Typography */}
        <section className="mt-16">
          <SectionLabel index="§2.3" title="Type scale" />
          <div className="space-y-7">
            {typeScale.map((row) => (
              <div key={row.name} className="border-t border-subtle pt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-wide text-text-tertiary">
                    {row.name}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">{row.spec}</span>
                </div>
                <p className={`mt-2.5 ${row.cls}`}>{row.sample}</p>
              </div>
            ))}

            {/* Mono sample */}
            <div className="border-t border-subtle pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-wide text-text-tertiary">
                  mono
                </span>
                <span className="font-mono text-[10px] text-text-muted">JetBrains Mono</span>
              </div>
              <p className="mt-2.5 font-mono text-[13px] text-accent-cyan">
                {`{ salary: [220000, 310000], remote: true }`}
              </p>
            </div>
          </div>
        </section>

        {/* Color tokens */}
        <section className="mt-16">
          <SectionLabel index="§2.1" title="Surfaces" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {surfaces.map((s) => (
              <ColorSwatch key={s.token} {...s} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel index="§2.1" title="Borders" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {borders.map((b) => (
              <BorderSwatch key={b.token} {...b} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel index="§2.1" title="Text" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {textTokens.map((t) => (
              <ColorSwatch key={t.token} {...t} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionLabel index="§2.1" title="Accents" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {accents.map((a) => (
              <ColorSwatch key={a.token} {...a} />
            ))}
          </div>
        </section>

        <footer className="mt-20 border-t border-subtle pt-6">
          <p className="font-mono text-caption text-text-muted">
            chainwork — phase 0 · project init + design tokens
          </p>
        </footer>
      </div>
    </main>
  );
}
