import ReactMarkdown from "react-markdown";
import { sanitizeJobHtml } from "@/lib/sanitize-job-html";

/**
 * Renders a job description that may be EITHER raw ATS HTML (Greenhouse rows)
 * or Markdown (Ashby / Lever rows). HTML is sanitized to a small safe tag set
 * and injected; Markdown goes through react-markdown. Both share the same
 * typographic styling so the page reads consistently.
 */

const PROSE =
  `space-y-3 text-[14px] leading-[1.7] text-text-secondary
   [&_a]:text-accent-blue [&_a]:underline [&_a]:break-words
   [&_h2]:mt-5 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-text-primary
   [&_h3]:mt-4 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-text-primary
   [&_h4]:mt-4 [&_h4]:text-[13px] [&_h4]:font-semibold [&_h4]:text-text-primary
   [&_code]:rounded [&_code]:bg-glass-hi [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-accent-cyan
   [&_li]:marker:text-text-muted
   [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
   [&_strong]:font-semibold [&_strong]:text-text-primary
   [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5`;

/** Heuristic: does this look like HTML (block/inline tags) rather than Markdown? */
function looksLikeHtml(s: string): boolean {
  return /<(p|div|ul|ol|li|h[1-6]|br|strong|em|span|a|table)\b/i.test(s);
}

export function JobDescription({ content }: { content: string }) {
  if (looksLikeHtml(content)) {
    return (
      <div
        className={PROSE}
        dangerouslySetInnerHTML={{ __html: sanitizeJobHtml(content) }}
      />
    );
  }
  return (
    <div className={PROSE}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
