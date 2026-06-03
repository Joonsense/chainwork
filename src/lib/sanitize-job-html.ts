import sanitizeHtml from "sanitize-html";

/**
 * Sanitize raw ATS job-description HTML for safe rendering.
 *
 * Many ingested rows (esp. Greenhouse) store the ATS HTML verbatim — wrapper
 * <div class="content-intro">, inline styles, Slack/ATS data-* attributes,
 * and the occasional duplicated boilerplate paragraph (e.g. a Pay Transparency
 * notice repeated twice). React renders that as escaped text, which reads like
 * broken/fake content.
 *
 * This keeps ONLY a small set of structural tags, drops every attribute except
 * a safe `href`, unwraps unknown wrappers (their text content is preserved),
 * and collapses adjacent duplicate blocks. It never rewrites the wording — it
 * only cleans markup, so the posting stays factually identical to the source.
 */

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "a",
];

/**
 * Drop duplicate boilerplate blocks. Some ATS posts paste the same notice
 * twice (e.g. a Pay Transparency notice), sometimes adjacent, sometimes far
 * apart. We keep the FIRST occurrence of any substantial (>60 char) block and
 * remove later exact copies. Short blocks are left alone so legitimately
 * repeated bullets aren't touched.
 */
function dedupeBlocks(html: string): string {
  const seen = new Set<string>();
  return html.replace(
    /<(p|li|h2|h3|h4)>([\s\S]*?)<\/\1>/gi,
    (match, _tag, inner: string) => {
      const key = inner.replace(/\s+/g, " ").trim().toLowerCase();
      if (key.length > 60) {
        if (seen.has(key)) return "";
        seen.add(key);
      }
      return match;
    },
  );
}

/**
 * Labelled-notice paragraphs (e.g. "Pay Transparency Notice: …") that some ATS
 * posts paste twice with *different* numbers — so exact-text dedupe misses them.
 * A single posting can only carry one such notice, so we keep the FIRST and drop
 * later ones bearing the same label. Wording is untouched; we only remove the
 * contradictory duplicate block.
 */
const SINGLETON_NOTICE_LABELS = ["pay transparency notice"];

function dedupeLabelledNotices(html: string): string {
  const seen = new Set<string>();
  return html.replace(/<p>([\s\S]*?)<\/p>/gi, (match, inner: string) => {
    const text = inner
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    const label = SINGLETON_NOTICE_LABELS.find((l) => text.startsWith(l));
    if (label) {
      if (seen.has(label)) return "";
      seen.add(label);
    }
    return match;
  });
}

export function sanitizeJobHtml(input: string): string {
  if (!input) return "";

  const cleaned = sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href"] },
    // Only real links; drops javascript:, data:, etc.
    allowedSchemes: ["http", "https", "mailto"],
    // Unknown tags (div, span, section, figure…) are removed but their inner
    // text/children are kept, so wrappers like content-intro just vanish.
    disallowedTagsMode: "discard",
    transformTags: {
      // Preserve emphasis even when the source used legacy/aliased tags.
      h1: "h2",
      h5: "h4",
      h6: "h4",
      b: "strong",
      i: "em",
      // Force safe link behaviour on every anchor.
      a: (tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...(attribs.href ? { href: attribs.href } : {}),
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    },
    // Strip empty paragraphs / dangling whitespace blocks.
    exclusiveFilter: (frame) =>
      (frame.tag === "p" || frame.tag === "li") &&
      !frame.text.trim() &&
      !frame.mediaChildren.length,
  });

  return dedupeLabelledNotices(dedupeBlocks(cleaned)).trim();
}
