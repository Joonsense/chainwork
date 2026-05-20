"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Layers, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { formatSalary } from "@/lib/format";
import type { PaletteResult } from "@/db/queries";

/* Empty-state placeholders (mock — real recents land with auth). */
const RECENT = ["senior rust", "$200k+ remote", "protocol engineer"];
const TRENDING = [
  "Solana Rust",
  "ZK research",
  "AI x DeFi",
  "Founding engineer",
  "Smart contract auditor",
];

const GROUP_CLS =
  "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:font-mono " +
  "[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase " +
  "[&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-text-tertiary";

/**
 * Raycast-style command palette. Opens on Cmd/Ctrl+K or the `cw:cmdk`
 * window event (fired by the hero / nav search triggers). Desktop power
 * feature — mobile search boxes fall back to a normal /jobs?q= form.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState("");
  const [results, setResults] = useState<PaletteResult | null>(null);
  const [loading, setLoading] = useState(false);

  // open via Cmd/Ctrl+K or a trigger event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onTrigger() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("cw:cmdk", onTrigger);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cw:cmdk", onTrigger);
    };
  }, []);

  // reset when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setLoading(false);
    }
  }, [open]);

  // debounced search (200ms)
  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        setResults((await res.json()) as PaletteResult);
      } catch {
        /* aborted or network error */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  const close = useCallback(() => setOpen(false), []);

  const goToJob = useCallback(
    (slug: string) => {
      close();
      router.push(`/jobs/${slug}`);
    },
    [router, close],
  );

  const goToSearch = useCallback(
    (q: string, eco?: string) => {
      close();
      const params = new URLSearchParams({ q });
      if (eco) params.set("eco", eco);
      router.push(`/jobs?${params.toString()}`);
    },
    [router, close],
  );

  const quickApply = useCallback(
    (slug: string): boolean => {
      const job = results?.jobs.find((j) => j.slug === slug);
      if (!job) return false;
      const url =
        job.applyUrl ?? (job.applyEmail ? `mailto:${job.applyEmail}` : null);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      void fetch(`/api/apply/${slug}`, { method: "POST" }).catch(() => {});
      close();
      return true;
    },
    [results, close],
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Cmd/Ctrl+Enter → quick apply, bypassing cmdk's plain-Enter open.
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      quickApply(highlighted);
    }
  }

  const term = query.trim();
  const hasResults =
    !!results &&
    (results.jobs.length > 0 ||
      results.companies.length > 0 ||
      results.ecosystems.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] max-w-[640px] translate-y-0 gap-0 overflow-hidden rounded-2xl border-line bg-elevated/95 p-0 shadow-2xl backdrop-blur-xl"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search roles, companies, and ecosystems
        </DialogDescription>

        <Command
          shouldFilter={false}
          value={highlighted}
          onValueChange={setHighlighted}
          className="bg-transparent"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            onKeyDown={onInputKeyDown}
            placeholder="Search roles, companies, ecosystems…"
            className="text-[14px]"
          />

          <CommandList className="max-h-[440px]">
            {/* empty query → Recent + Trending */}
            {!term && (
              <>
                <CommandGroup heading="Recent" className={GROUP_CLS}>
                  {RECENT.map((r) => (
                    <PaletteRow
                      key={`recent-${r}`}
                      value={`recent-${r}`}
                      onSelect={() => setQuery(r)}
                      icon={<Clock size={14} className="text-text-tertiary" />}
                      title={r}
                    />
                  ))}
                </CommandGroup>
                <CommandGroup heading="Trending" className={GROUP_CLS}>
                  {TRENDING.map((t) => (
                    <PaletteRow
                      key={`trend-${t}`}
                      value={`trend-${t}`}
                      onSelect={() => setQuery(t)}
                      icon={
                        <TrendingUp size={14} className="text-accent-cyan" />
                      }
                      title={t}
                    />
                  ))}
                </CommandGroup>
              </>
            )}

            {term && loading && !results && (
              <div className="px-4 py-10 text-center text-[12.5px] text-text-tertiary">
                Searching…
              </div>
            )}

            {term && !loading && results && !hasResults && (
              <div className="px-4 py-10 text-center">
                <div className="text-[13px] text-text-secondary">
                  No matches for “{term}”
                </div>
                <div className="mt-1 text-[11.5px] text-text-tertiary">
                  Try a different role, skill, or company.
                </div>
              </div>
            )}

            {results && results.jobs.length > 0 && (
              <CommandGroup
                heading={`Top matches · ${results.jobsTotal}`}
                className={GROUP_CLS}
              >
                {results.jobs.map((job) => (
                  <PaletteRow
                    key={job.slug}
                    value={job.slug}
                    onSelect={() => goToJob(job.slug)}
                    icon={
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[10px] font-semibold"
                        style={{ background: job.logoBg, color: job.logoFg }}
                      >
                        {job.logoText}
                      </span>
                    }
                    title={job.title}
                    sub={`${job.company} · ${job.location}`}
                    meta={formatSalary(job.salaryMin, job.salaryMax)}
                  />
                ))}
              </CommandGroup>
            )}

            {results && results.companies.length > 0 && (
              <CommandGroup heading="Companies" className={GROUP_CLS}>
                {results.companies.map((c) => (
                  <PaletteRow
                    key={`company-${c.slug}`}
                    value={`company-${c.slug}`}
                    onSelect={() => goToSearch(c.name)}
                    icon={
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[10px] font-semibold"
                        style={{ background: c.logoBg, color: c.logoFg }}
                      >
                        {c.logoText}
                      </span>
                    }
                    title={c.name}
                    sub={[c.stage, c.size, c.focus].filter(Boolean).join(" · ")}
                  />
                ))}
              </CommandGroup>
            )}

            {results && results.ecosystems.length > 0 && (
              <CommandGroup heading="Ecosystems" className={GROUP_CLS}>
                {results.ecosystems.map((e) => (
                  <PaletteRow
                    key={`eco-${e.key}`}
                    value={`eco-${e.key}`}
                    onSelect={() => goToSearch(term, e.key)}
                    icon={<Layers size={14} className="text-accent-purple" />}
                    title={`${term} roles in ${e.label}`}
                    meta={`${e.count}`}
                  />
                ))}
              </CommandGroup>
            )}

            {results &&
              (results.jobsTotal > 5 || results.companiesTotal > 3) && (
                <div className="p-2">
                  <CommandItem
                    value="__see_all__"
                    onSelect={() => goToSearch(term)}
                    className="cursor-pointer justify-center gap-2 rounded-lg bg-gradient-brand py-2 text-[12.5px] font-semibold text-white data-[selected=true]:brightness-110"
                  >
                    See all {results.jobsTotal} roles · {results.companiesTotal}{" "}
                    companies
                    <ArrowRight size={12} strokeWidth={2.4} />
                  </CommandItem>
                </div>
              )}
          </CommandList>

          {/* footer */}
          <div className="flex items-center justify-between border-t border-subtle px-3.5 py-2.5 text-[10.5px] text-text-tertiary">
            <div className="flex items-center gap-3">
              <Hint keys={["↑", "↓"]} label="navigate" />
              <Hint keys={["↩"]} label="open" />
              <Hint keys={["⌘", "↩"]} label="quick apply" />
            </div>
            <span className="font-mono text-text-muted">esc</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function Hint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-line bg-glass-hi px-1 font-mono text-[9.5px] text-text-secondary"
        >
          {k}
        </kbd>
      ))}
      <span>{label}</span>
    </span>
  );
}

function PaletteRow({
  value,
  onSelect,
  icon,
  title,
  sub,
  meta,
}: {
  value: string;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  sub?: string;
  meta?: string;
}) {
  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
      className="mx-1 cursor-pointer gap-3 rounded-lg border-l-2 border-l-transparent px-2.5 py-2 data-[selected=true]:border-l-accent-blue data-[selected=true]:bg-glass-hi"
    >
      <span className="flex shrink-0 items-center">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium text-text-primary">
          {title}
        </span>
        {sub && (
          <span className="truncate text-[11.5px] text-text-tertiary">
            {sub}
          </span>
        )}
      </span>
      {meta && (
        <span className="shrink-0 font-mono text-[12px] font-semibold text-text-secondary">
          {meta}
        </span>
      )}
    </CommandItem>
  );
}
