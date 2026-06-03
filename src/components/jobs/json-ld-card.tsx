"use client";

import { useState } from "react";
import { Copy, Check, Braces, ChevronDown } from "lucide-react";
import { toast } from "sonner";

/**
 * Machine-readable JSON-LD card. The schema.org JobPosting is the same data
 * already emitted in the page's <script type="application/ld+json"> for
 * crawlers, so on screen it stays COLLAPSED by default — one quiet line a
 * human can expand if curious, without the raw blob dominating the page.
 */
export function JsonLdCard({ json }: { json: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

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
      <div className="flex items-center justify-between px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:text-text-primary"
        >
          <ChevronDown
            size={12}
            className={`text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
          <Braces size={12} className="text-accent-blue" />
          schema.org · JobPosting
        </button>
        {open && (
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
        )}
      </div>
      {open && (
        <pre className="cw-no-scrollbar overflow-x-auto border-t border-subtle p-4 font-mono text-[11.5px] leading-[1.7] text-text-secondary">
          {json}
        </pre>
      )}
    </div>
  );
}
