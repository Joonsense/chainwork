import { Zap, Search, Sparkles, Bookmark, CircleUser } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* Placeholder bottom nav — wired up in a later phase. */
const TABS: { key: string; label: string; icon: LucideIcon; active?: boolean }[] = [
  { key: "feed", label: "Feed", icon: Zap, active: true },
  { key: "search", label: "Search", icon: Search },
  { key: "match", label: "Match", icon: Sparkles },
  { key: "saved", label: "Saved", icon: Bookmark },
  { key: "me", label: "Me", icon: CircleUser },
];

/** Fixed 5-icon bottom nav, mobile only. Visual placeholder for now. */
export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-subtle bg-base/85 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            className={`flex flex-col items-center gap-1 rounded-md py-1.5 ${
              tab.active ? "text-text-primary" : "text-text-tertiary"
            }`}
          >
            <Icon size={17} strokeWidth={tab.active ? 2.2 : 1.7} />
            <span
              className={`text-[9.5px] ${tab.active ? "font-semibold" : "font-medium"}`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
