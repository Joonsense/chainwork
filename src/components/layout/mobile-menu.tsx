"use client";

import Link from "next/link";
import { Menu, ArrowUpRight } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/ui/brand-logo";

type NavUser = { name: string } | null;

const LINKS: { label: string; href: string; badge?: string }[] = [
  { label: "Jobs", href: "/" },
  { label: "Hiring Pulse", href: "/pulse", badge: "🔥" },
  { label: "For companies", href: "/for-companies" },
  { label: "Job alerts", href: "/alerts" },
  { label: "MCP / API", href: "/mcp", badge: "new" },
  { label: "Pricing", href: "/pricing" },
  { label: "Directory", href: "/directory" },
  { label: "About", href: "/about" },
];

/**
 * Mobile nav drawer. The compact glass-nav has no room for the full link
 * set below md, so the hamburger opens this Sheet — the only way to reach
 * Pulse, Hire, alerts, MCP, pricing, etc. on a phone.
 */
export function MobileMenu({ user }: { user: NavUser }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="cw-focus flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary"
        >
          <Menu size={16} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[82%] max-w-[320px] border-l border-line bg-surface p-0"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        <div className="flex items-center gap-2 border-b border-subtle px-5 py-4">
          <BrandLogo size={15} />
        </div>

        <nav className="flex flex-col px-2 py-2">
          {LINKS.map((l) => (
            <SheetClose asChild key={l.href}>
              <Link
                href={l.href}
                className="cw-focus flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] text-text-secondary transition-colors hover:bg-glass-hi hover:text-text-primary"
              >
                <span>{l.label}</span>
                {l.badge &&
                  (l.badge === "new" ? (
                    <span className="rounded-[4px] border border-accent-blue/40 bg-accent-blue/15 px-1 font-mono text-[9px] text-accent-blue">
                      new
                    </span>
                  ) : (
                    <span className="text-[12px]">{l.badge}</span>
                  ))}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-subtle px-4 py-4">
          <SheetClose asChild>
            <Link href="/post" className="cw-apply h-10 w-full text-[14px]">
              Post a job
            </Link>
          </SheetClose>
          {user ? (
            <div className="grid grid-cols-2 gap-2">
              <SheetClose asChild>
                <Link
                  href="/me/saved"
                  className="cw-focus flex h-10 items-center justify-center rounded-lg border border-subtle bg-glass text-[13px] text-text-bright transition-colors hover:border-line"
                >
                  Saved
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/me"
                  className="cw-focus flex h-10 items-center justify-center rounded-lg border border-subtle bg-glass text-[13px] text-text-bright transition-colors hover:border-line"
                >
                  Account
                </Link>
              </SheetClose>
            </div>
          ) : (
            <SheetClose asChild>
              <Link
                href="/sign-in"
                className="cw-focus flex h-10 items-center justify-center gap-1 rounded-lg border border-subtle bg-glass text-[13px] text-text-bright transition-colors hover:border-line"
              >
                Sign in
                <ArrowUpRight size={13} />
              </Link>
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
