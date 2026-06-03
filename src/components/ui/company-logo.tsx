"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Company logo with a graceful fallback chain:
 *   1. logo.dev   (high-quality, needs NEXT_PUBLIC_LOGO_DEV_TOKEN)
 *   2. Google favicon  (no token required)
 *   3. monogram box  (the company's stored logoText + colors)
 *
 * Each source is tried in order via the <img> onError handler, so a broken or
 * missing logo always degrades to the next option — there are never broken
 * image icons. Without the logo.dev token it simply starts at the favicon.
 */

type Props = {
  name: string;
  website?: string | null;
  logoText: string;
  logoBg: string;
  logoFg: string;
  /** sizing / border / rounding classes for the square wrapper */
  className?: string;
  /** pixel size requested from the logo providers */
  px?: number;
};

/** Bare registrable domain from a website URL, e.g. "https://a.coinbase.com/x" → "coinbase.com". */
function domainOf(website?: string | null): string | null {
  if (!website) return null;
  try {
    const host = new URL(
      website.startsWith("http") ? website : `https://${website}`,
    ).hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

export function CompanyLogo({
  name,
  website,
  logoText,
  logoBg,
  logoFg,
  className,
  px = 128,
}: Props) {
  const domain = domainOf(website);

  const sources = domain
    ? [
        LOGO_DEV_TOKEN
          ? `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=${px}&format=png`
          : null,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=${px}`,
      ].filter((s): s is string => Boolean(s))
    : [];

  const [idx, setIdx] = useState(0);
  const src = sources[idx];

  // Fallback: monogram box (also the initial state when there's no domain).
  if (!src) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center font-semibold",
          className,
        )}
        style={{ background: logoBg, color: logoFg }}
        aria-hidden
      >
        {logoText}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-white",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain p-0.5"
        onError={() => setIdx((i) => i + 1)}
      />
    </span>
  );
}
