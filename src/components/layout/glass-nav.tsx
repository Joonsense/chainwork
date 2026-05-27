import Link from "next/link";
import { Search, Bookmark, Menu } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CommandTrigger } from "@/components/command-trigger";
import { NavAuth } from "@/components/auth/nav-auth";
import { getServerSession } from "@/lib/auth";

/* Center nav links. `lgOnly` ones are hidden on the 768–1024 range so the
   bar never overflows; they rejoin at lg. */
const NAV_LINKS: { label: string; href: string; active?: boolean; lgOnly?: boolean; badge?: string }[] = [
  { label: "Jobs", href: "/", active: true },
  { label: "Pulse", href: "/pulse", badge: "🔥" },
  { label: "Hire", href: "/for-companies" },
  { label: "Salaries", href: "/salaries", lgOnly: true },
  { label: "Job alerts", href: "/alerts", lgOnly: true },
];

/**
 * Sticky glass nav (spec §2.4). Floating glass pill: brand · links · actions.
 * Below md it collapses to a compact bar with a hamburger.
 */
export async function GlassNav() {
  const session = await getServerSession();
  const navUser = session ? { name: session.user.name } : null;

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-base via-base/80 to-transparent">
      {/* ── desktop / tablet ── */}
      <div className="hidden px-4 py-3 md:block lg:px-6">
        <div className="cw-glass flex h-[52px] items-center justify-between rounded-2xl pl-[18px] pr-2">
          <div className="flex items-center gap-5 lg:gap-7">
            <Link href="/" aria-label="Chainwork home">
              <BrandLogo />
            </Link>
            <nav className="flex items-center gap-0.5 text-[13px]">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  prefetch={false}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 transition-colors ${
                    l.lgOnly ? "hidden lg:block" : ""
                  } ${
                    l.active
                      ? "bg-glass-hi font-medium text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {l.label}
                  {l.badge && (
                    <span className="text-[11px]">{l.badge}</span>
                  )}
                </Link>
              ))}
              <Link
                href="/api"
                prefetch={false}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-text-secondary transition-colors hover:text-text-primary"
              >
                API
                <span className="rounded-[4px] border border-accent-blue/40 bg-accent-blue/15 px-1 font-mono text-[9px] text-accent-blue">
                  new
                </span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <CommandTrigger
              ariaLabel="Search roles, skills, and companies"
              className="flex h-[30px] items-center gap-2 rounded-lg border border-subtle bg-glass px-2.5 text-text-tertiary transition-colors hover:border-line hover:text-text-secondary"
            >
              <Search size={13} className="shrink-0" />
              <span className="hidden text-[12px] lg:inline">
                Search roles, skills…
              </span>
              <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-line bg-glass-hi px-1 font-mono text-[10px] text-text-secondary">
                ⌘K
              </kbd>
            </CommandTrigger>
            <NavAuth user={navUser} variant="desktop" />
            <Link href="/post" className="cw-apply h-[30px] px-3 text-[12px]">
              Post a job
            </Link>
          </div>
        </div>
      </div>

      {/* ── mobile ── */}
      <div className="px-3 py-2.5 md:hidden">
        <div className="cw-glass flex h-12 items-center justify-between rounded-xl pl-3.5 pr-1.5">
          <Link href="/" aria-label="Chainwork home">
            <BrandLogo size={14} />
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Saved jobs"
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary"
            >
              <Bookmark size={14} />
            </button>
            <NavAuth user={navUser} variant="mobile" />
            <button
              type="button"
              aria-label="Open menu"
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary"
            >
              <Menu size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
