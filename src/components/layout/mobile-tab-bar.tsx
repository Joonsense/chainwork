import Link from "next/link";
import { Zap, Search, Sparkles, Bookmark, CircleUser } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* Bottom nav, mobile only. Mounted on the home feed; "Feed" is the
   active tab there. */
const TABS: { key: string; label: string; icon: LucideIcon; href: string; active?: boolean }[] = [
  { key: "feed", label: "Feed", icon: Zap, href: "/", active: true },
  { key: "search", label: "Search", icon: Search, href: "/jobs" },
  { key: "match", label: "Match", icon: Sparkles, href: "/jobs?sort=fit" },
  { key: "saved", label: "Saved", icon: Bookmark, href: "/me/saved" },
  { key: "me", label: "Me", icon: CircleUser, href: "/me" },
];

/** Fixed 5-icon bottom nav, mobile only. */
export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-subtle bg-base/85 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`cw-focus flex flex-col items-center gap-1 rounded-md py-1.5 transition-colors ${
              tab.active
                ? "text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <Icon size={17} strokeWidth={tab.active ? 2.2 : 1.7} />
            <span
              className={`text-[9.5px] ${tab.active ? "font-semibold" : "font-medium"}`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
