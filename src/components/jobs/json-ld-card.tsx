"use client";

import { useState } from "react";
import { Copy, Check, Braces } from "lucide-react";
import { toast } from "sonner";

/**
 * Machine-readable JSON-LD card. Shows the precomputed schema.org
 * JobPosting verbatim (no highlighting) with a copy-to-clipboard button.
 */
export function JsonLdCard({ json }: { json: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success("JSON-LD copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — clipboard unavailable");
    }
  }

  return (
    <div className="cw-glass overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-subtle px-4 py-2.5">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary">
          <Braces size={12} className="text-accent-blue" />
          schema.org · JobPosting
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md border border-line bg-glass-hi px-2 py-1 font-mono text-[11px] text-text-bright transition-colors hover:border-strong"
        >
          {copied ? (
            <Check size={11} strokeWidth={2.6} className="text-accent-green" />
          ) : (
            <Copy size={11} />
          )}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="cw-no-scrollbar overflow-x-auto p-4 font-mono text-[11.5px] leading-[1.7] text-text-secondary">
        {json}
      </pre>
    </div>
  );
}
