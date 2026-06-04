"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * A code block with a copy-to-clipboard button. Used on /mcp where the
 * config snippets are the primary action — selecting by hand is the main
 * onboarding friction.
 */
export function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <div className="relative">
      <pre className="cw-no-scrollbar overflow-x-auto rounded-lg border border-subtle bg-elevated p-4 pr-12 font-mono text-[12px] leading-relaxed text-text-primary">
        {code}
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={
          copied ? "Copied" : label ? `Copy ${label}` : "Copy to clipboard"
        }
        className="cw-focus absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-md border border-line bg-glass text-text-tertiary transition-colors hover:border-strong hover:text-text-primary"
      >
        {copied ? (
          <Check size={13} className="text-accent-green" />
        ) : (
          <Copy size={13} />
        )}
      </button>
    </div>
  );
}
