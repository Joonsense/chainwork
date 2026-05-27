"use client";

import { useEffect } from "react";

/**
 * Invisible client component that fires a view count increment
 * once per page load. Mounted on the job detail page.
 */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/jobs/${slug}/view`, { method: "POST" }).catch(() => {
      // Silently ignore network errors
    });
  }, [slug]);

  return null;
}
