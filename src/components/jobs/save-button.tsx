"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { useSavedJobs } from "./saved-jobs-provider";

/**
 * Bookmark toggle for a job card (P9). Signed out → opens the sign-in
 * dialog; signed in → optimistically toggles the saved state.
 *
 * Sits above a card's stretched link via `relative z-10`.
 */
export function SaveButton({
  slug,
  size = "md",
}: {
  slug: string;
  size?: "sm" | "md" | "lg";
}) {
  const { authed, ready, isSaved, toggle } = useSavedJobs();
  const saved = isSaved(slug);
  const dim =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-8 w-8";
  const icon = size === "sm" ? 14 : size === "lg" ? 16 : 15;

  const button = (onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "Remove from saved roles" : "Save this role"}
      aria-pressed={saved}
      title={saved ? "Saved" : "Save role"}
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center rounded-lg border transition-colors",
        dim,
        saved
          ? "border-accent-blue/50 bg-accent-blue/15 text-accent-blue"
          : "border-line bg-glass text-text-tertiary hover:border-strong hover:text-text-primary",
      )}
    >
      <Bookmark size={icon} className={saved ? "fill-current" : undefined} />
    </button>
  );

  // Signed out — the bookmark opens the sign-in dialog instead.
  if (ready && !authed) {
    return <SignInDialog trigger={button()} />;
  }
  return button(() => toggle(slug));
}
