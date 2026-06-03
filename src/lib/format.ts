/** Compact relative-time label, e.g. "14s", "3h", "5d". No "ago" suffix. */
export function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${Math.max(seconds, 1)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

/**
 * "$210k–285k" from raw yearly USD amounts.
 * Returns "Competitive" when both are 0 (ATS job with no salary disclosed).
 */
export function formatSalary(min: number, max: number): string {
  if (min === 0 && max === 0) return "Competitive";
  const k = (n: number) => `${Math.round(n / 1000)}k`;
  if (min === 0) return `Up to $${k(max)}`;
  if (max === 0) return `$${k(min)}+`;
  return `$${k(min)}–${k(max)}`;
}

/** First paragraph of a markdown string — used as a card blurb. */
export function firstParagraph(markdown: string): string {
  return markdown.split("\n\n")[0].trim();
}

/**
 * Plain-text excerpt for card blurbs and meta descriptions. Works on BOTH the
 * raw-HTML descriptions (Greenhouse) and the Markdown ones (Ashby/Lever): it
 * strips tags, decodes the common entities, drops Markdown markers, and
 * collapses whitespace — so a blurb never shows `<div class=…>` or `**`.
 */
export function plainTextExcerpt(content: string, max = 180): string {
  const text = content
    .replace(/<[^>]+>/g, " ") // tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&apos;/g, "'")
    .replace(/[#>*_`~]+/g, " ") // markdown markers
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // md links → text
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
