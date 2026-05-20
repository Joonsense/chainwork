"use client";

/** Opens the command palette. Wraps arbitrary search-box markup. */
export function CommandTrigger({
  children,
  className,
  ariaLabel = "Open search",
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => window.dispatchEvent(new Event("cw:cmdk"))}
      className={className}
    >
      {children}
    </button>
  );
}
