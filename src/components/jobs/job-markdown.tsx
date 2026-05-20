import ReactMarkdown from "react-markdown";

/**
 * Renders job description markdown → HTML. Styling is applied through
 * descendant selectors so no `components` overrides are needed.
 */
export function JobMarkdown({ children }: { children: string }) {
  return (
    <div
      className="space-y-3 text-[14px] leading-[1.7] text-text-secondary
        [&_a]:text-accent-blue [&_a]:underline
        [&_code]:rounded [&_code]:bg-glass-hi [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-accent-cyan
        [&_li]:marker:text-text-muted
        [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
        [&_strong]:font-semibold [&_strong]:text-text-primary
        [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
