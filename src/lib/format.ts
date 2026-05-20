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

/** "$210k–285k" from raw yearly USD amounts. */
export function formatSalary(min: number, max: number): string {
  const k = (n: number) => `${Math.round(n / 1000)}k`;
  return `$${k(min)}–${k(max)}`;
}

/** First paragraph of a markdown string — used as a card blurb. */
export function firstParagraph(markdown: string): string {
  return markdown.split("\n\n")[0].trim();
}
