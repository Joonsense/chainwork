import { Bookmark, ArrowRight } from "lucide-react";

/**
 * Sticky bottom apply bar — last element in flow, pinned to the viewport
 * bottom. Save · Apply now. "Apply now" hits the apply route handler, which
 * records intent before 308-redirecting to the company's real ATS page.
 */
export function StickyApplyBar({ slug }: { slug: string }) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-subtle bg-base/85 px-3 py-3 backdrop-blur-xl sm:px-5">
      <div
        className="mx-auto flex max-w-[760px] items-center gap-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          type="button"
          aria-label="Save job"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-glass text-text-secondary transition-colors hover:border-strong hover:text-text-primary"
        >
          <Bookmark size={16} />
        </button>
        <a
          href={`/jobs/${slug}/apply`}
          target="_blank"
          rel="noopener noreferrer"
          className="cw-apply h-11 flex-1 text-[14px]"
        >
          Apply now
          <ArrowRight size={14} strokeWidth={2.4} />
        </a>
      </div>
    </div>
  );
}
